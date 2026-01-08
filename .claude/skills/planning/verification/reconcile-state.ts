/**
 * State Reconciliation and Recovery
 * 
 * Ensures idempotent orchestration by synchronizing:
 * - Beads task status ↔ manifest.jsonl status
 * - Recovering from mid-feature crashes
 * - Detecting and reporting manifest corruption
 * 
 * Run at orchestration start before any feature processing.
 * 
 * Usage: bun run reconcile-state.ts <plan-dir>
 * 
 * Exit codes:
 * - 0: Reconciliation complete, safe to proceed
 * - 1: Unrecoverable error (manifest corrupt, beads unavailable)
 * - 2: Recoverable issues fixed, re-run recommended
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { $ } from "bun";

interface ManifestEntry {
  id: string;
  file: string;
  title: string;
  description: string;
  depends_on: string[];
  status: "pending" | "in_progress" | "completed" | "failed";
  verification: string;
  beads_id: string;
  devops_id?: string;
}

interface ReconciliationResult {
  action: string;
  featureId: string;
  from: string;
  to: string;
  reason: string;
}

async function getBeadsStatus(taskId: string): Promise<string | null> {
  try {
    const result = await $`bd show ${taskId} --format=json`.json();
    return result.status || null;
  } catch {
    return null;
  }
}

async function updateBeadsStatus(taskId: string, status: string): Promise<boolean> {
  try {
    await $`bd update ${taskId} --status=${status}`.quiet();
    return true;
  } catch {
    return false;
  }
}

async function closeBeadsTask(taskId: string, reason: string): Promise<boolean> {
  try {
    await $`bd close ${taskId} --reason=${reason}`.quiet();
    return true;
  } catch {
    return false;
  }
}

function readManifest(planDir: string): ManifestEntry[] | null {
  const manifestPath = join(planDir, "manifest.jsonl");
  if (!existsSync(manifestPath)) {
    return null;
  }

  const content = readFileSync(manifestPath, "utf-8");
  const lines = content.trim().split("\n").filter(l => l.length > 0);
  const entries: ManifestEntry[] = [];

  for (let i = 0; i < lines.length; i++) {
    try {
      entries.push(JSON.parse(lines[i]));
    } catch (err) {
      console.error(`Manifest corruption at line ${i + 1}: ${err}`);
      return null;
    }
  }

  return entries;
}

function writeManifest(planDir: string, entries: ManifestEntry[]): void {
  const manifestPath = join(planDir, "manifest.jsonl");
  const content = entries.map(e => JSON.stringify(e)).join("\n") + "\n";
  writeFileSync(manifestPath, content);
}

function validateManifestEntry(entry: ManifestEntry, index: number): string[] {
  const errors: string[] = [];
  const required = ["id", "file", "title", "status", "verification", "beads_id"];

  for (const field of required) {
    if (!(field in entry) || !entry[field as keyof ManifestEntry]) {
      errors.push(`Entry ${index} (${entry.id || "unknown"}): missing required field "${field}"`);
    }
  }

  const validStatuses = ["pending", "in_progress", "completed", "failed"];
  if (!validStatuses.includes(entry.status)) {
    errors.push(`Entry ${index} (${entry.id}): invalid status "${entry.status}"`);
  }

  return errors;
}

async function checkGitState(): Promise<{ uncommitted: string[]; branch: string }> {
  const uncommitted = await $`git status --porcelain`.text();
  const branch = await $`git branch --show-current`.text();

  return {
    uncommitted: uncommitted.trim().split("\n").filter(l => l.length > 0),
    branch: branch.trim()
  };
}

async function checkVerificationPasses(command: string): Promise<boolean> {
  try {
    await $`sh -c ${command}`.quiet();
    return true;
  } catch {
    return false;
  }
}

async function reconcile(planDir: string): Promise<void> {
  console.log("=== State Reconciliation ===\n");

  // Step 1: Sync beads with remote
  console.log("Syncing Beads...");
  try {
    await $`bd sync`.quiet();
    console.log("  ✓ Beads synced\n");
  } catch (err) {
    console.error("  ✗ Beads sync failed - is .beads/ initialized?");
    process.exit(1);
  }

  // Step 2: Read and validate manifest
  console.log("Reading manifest...");
  const entries = readManifest(planDir);
  if (!entries) {
    console.error("  ✗ Cannot read manifest.jsonl");
    process.exit(1);
  }
  console.log(`  ✓ Found ${entries.length} features\n`);

  // Step 3: Validate manifest structure
  console.log("Validating manifest structure...");
  const allErrors: string[] = [];
  for (let i = 0; i < entries.length; i++) {
    const errors = validateManifestEntry(entries[i], i);
    allErrors.push(...errors);
  }

  if (allErrors.length > 0) {
    console.error("  ✗ Manifest validation errors:");
    for (const err of allErrors) {
      console.error(`    - ${err}`);
    }
    process.exit(1);
  }
  console.log("  ✓ Manifest structure valid\n");

  // Step 4: Check git state
  console.log("Checking git state...");
  const gitState = await checkGitState();
  console.log(`  Branch: ${gitState.branch}`);
  if (gitState.uncommitted.length > 0) {
    console.log(`  ⚠ Uncommitted changes: ${gitState.uncommitted.length} files`);
  } else {
    console.log("  ✓ Working directory clean");
  }
  console.log();

  // Step 5: Reconcile each feature
  console.log("Reconciling feature states...\n");
  const results: ReconciliationResult[] = [];
  let modified = false;

  for (const entry of entries) {
    const beadsStatus = await getBeadsStatus(entry.beads_id);

    if (!beadsStatus) {
      console.log(`  ${entry.id}: ⚠ Beads task ${entry.beads_id} not found`);
      continue;
    }

    const manifestStatus = entry.status;

    // Case 1: Beads closed, manifest not completed
    if (beadsStatus === "closed" && manifestStatus !== "completed") {
      console.log(`  ${entry.id}: Beads closed → manifest completed`);
      entry.status = "completed";
      modified = true;
      results.push({
        action: "update_manifest",
        featureId: entry.id,
        from: manifestStatus,
        to: "completed",
        reason: "Beads task is closed"
      });
    }

    // Case 2: Manifest completed, beads not closed
    else if (manifestStatus === "completed" && beadsStatus !== "closed") {
      console.log(`  ${entry.id}: Manifest completed → closing Beads`);
      await closeBeadsTask(entry.beads_id, "Reconciliation: manifest shows completed");
      results.push({
        action: "close_beads",
        featureId: entry.id,
        from: beadsStatus,
        to: "closed",
        reason: "Manifest shows completed"
      });
    }

    // Case 3: Beads in_progress, manifest pending (crash during work)
    else if (beadsStatus === "in_progress" && manifestStatus === "pending") {
      console.log(`  ${entry.id}: Crash recovery - resetting Beads to open`);
      await updateBeadsStatus(entry.beads_id, "open");
      results.push({
        action: "reset_beads",
        featureId: entry.id,
        from: "in_progress",
        to: "open",
        reason: "Crash recovery: work was interrupted"
      });
    }

    // Case 4: Manifest in_progress, beads open (crash during work)
    else if (manifestStatus === "in_progress" && beadsStatus === "open") {
      console.log(`  ${entry.id}: Crash recovery - resetting manifest to pending`);
      entry.status = "pending";
      modified = true;
      results.push({
        action: "reset_manifest",
        featureId: entry.id,
        from: "in_progress",
        to: "pending",
        reason: "Crash recovery: work was interrupted"
      });
    }

    // Case 5: Both in_progress (crash mid-feature)
    else if (manifestStatus === "in_progress" && beadsStatus === "in_progress") {
      console.log(`  ${entry.id}: Mid-feature crash detected`);
      
      // Check if the work was actually completed
      const verificationPasses = await checkVerificationPasses(entry.verification);
      
      if (verificationPasses && gitState.uncommitted.length === 0) {
        console.log(`    → Verification passes, marking completed`);
        entry.status = "completed";
        modified = true;
        await closeBeadsTask(entry.beads_id, "Reconciliation: verification passed after crash");
        results.push({
          action: "complete_after_crash",
          featureId: entry.id,
          from: "in_progress",
          to: "completed",
          reason: "Verification passes, work was complete"
        });
      } else {
        console.log(`    → Verification fails or uncommitted changes, resetting to pending`);
        entry.status = "pending";
        modified = true;
        await updateBeadsStatus(entry.beads_id, "open");
        results.push({
          action: "reset_after_crash",
          featureId: entry.id,
          from: "in_progress",
          to: "pending",
          reason: "Verification fails or uncommitted changes exist"
        });
      }
    }

    // Case 6: Manifest failed (previous attempt failed)
    else if (manifestStatus === "failed") {
      console.log(`  ${entry.id}: Previously failed, resetting to pending for retry`);
      entry.status = "pending";
      modified = true;
      await updateBeadsStatus(entry.beads_id, "open");
      results.push({
        action: "reset_failed",
        featureId: entry.id,
        from: "failed",
        to: "pending",
        reason: "Resetting failed feature for retry"
      });
    }

    // Case 7: States match
    else {
      console.log(`  ${entry.id}: ✓ States consistent (${manifestStatus})`);
    }
  }

  // Step 6: Write updated manifest if modified
  if (modified) {
    console.log("\nWriting updated manifest...");
    writeManifest(planDir, entries);
    console.log("  ✓ Manifest updated");
  }

  // Step 7: Summary
  console.log("\n=== Reconciliation Summary ===\n");

  const stats = {
    pending: entries.filter(e => e.status === "pending").length,
    in_progress: entries.filter(e => e.status === "in_progress").length,
    completed: entries.filter(e => e.status === "completed").length,
    failed: entries.filter(e => e.status === "failed").length
  };

  console.log(`Features: ${entries.length} total`);
  console.log(`  Pending:     ${stats.pending}`);
  console.log(`  In Progress: ${stats.in_progress}`);
  console.log(`  Completed:   ${stats.completed}`);
  console.log(`  Failed:      ${stats.failed}`);
  console.log();

  if (results.length > 0) {
    console.log(`Reconciliation actions: ${results.length}`);
    for (const r of results) {
      console.log(`  - ${r.featureId}: ${r.action} (${r.reason})`);
    }
    console.log();
  }

  // Check if any features are stuck in_progress after reconciliation
  if (stats.in_progress > 0) {
    console.error("⚠ Warning: Features still in_progress after reconciliation");
    console.error("  This shouldn't happen - manual intervention may be required");
    process.exit(2);
  }

  console.log("✓ Reconciliation complete - safe to proceed\n");
}

// Main
const planDir = process.argv[2];
if (!planDir) {
  console.error("Usage: bun run reconcile-state.ts <plan-dir>");
  process.exit(1);
}

if (!existsSync(planDir)) {
  console.error(`Plan directory not found: ${planDir}`);
  process.exit(1);
}

reconcile(planDir).catch(err => {
  console.error("Reconciliation error:", err.message);
  process.exit(1);
});
