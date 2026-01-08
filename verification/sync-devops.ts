/**
 * Azure DevOps Boards Sync
 *
 * Syncs meaningful planning information to Azure DevOps for
 * stakeholder visibility. Beads remains source of truth.
 *
 * Usage: bun run sync-devops.ts <plan-dir> [--full|--status|--create-tasks]
 *
 * Modes:
 * - --full: Full sync (title, description, status for all items)
 * - --status: Status-only sync (faster, just updates states)
 * - --create-tasks: Create DevOps tasks for features that don't have devops_id
 *
 * Exit codes:
 * - 0: Sync successful
 * - 1: Error (missing config, auth failure)
 * - 2: Partial failure (some items failed to sync)
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { $ } from "bun";

interface DevOpsConfig {
  storyId: string;
  org: string;
  project: string;
}

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

function loadDevOpsConfig(planDir: string): DevOpsConfig | null {
  const configPath = join(planDir, ".devops");
  if (!existsSync(configPath)) return null;

  const content = readFileSync(configPath, "utf-8");
  const config: Partial<DevOpsConfig> = {};

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#") || !trimmed.includes("=")) continue;

    const [key, ...valueParts] = trimmed.split("=");
    const value = valueParts.join("=").trim();

    switch (key.trim()) {
      case "STORY_ID": config.storyId = value; break;
      case "ORG": config.org = value; break;
      case "PROJECT": config.project = value; break;
    }
  }

  if (!config.storyId || !config.org || !config.project) return null;
  return config as DevOpsConfig;
}

function readManifest(planDir: string): ManifestEntry[] {
  const manifestPath = join(planDir, "manifest.jsonl");
  if (!existsSync(manifestPath)) return [];

  const content = readFileSync(manifestPath, "utf-8");
  return content.trim().split("\n").filter(l => l.length > 0).map(l => JSON.parse(l));
}

function writeManifest(planDir: string, entries: ManifestEntry[]): void {
  const manifestPath = join(planDir, "manifest.jsonl");
  writeFileSync(manifestPath, entries.map(e => JSON.stringify(e)).join("\n") + "\n");
}

function loadPlanMetadata(planDir: string): { title: string; summary: string } {
  const planPath = join(planDir, "plan.md");
  if (!existsSync(planPath)) return { title: "Feature Implementation", summary: "" };

  const content = readFileSync(planPath, "utf-8");
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const summaryMatch = content.match(/^##\s+Summary\s*\n([\s\S]*?)(?=\n##|\n$)/m);

  return {
    title: titleMatch ? titleMatch[1] : "Feature Implementation",
    summary: summaryMatch ? summaryMatch[1].trim() : ""
  };
}

function mapStatusToDevOps(status: ManifestEntry["status"]): string {
  switch (status) {
    case "pending": return "New";
    case "in_progress": return "Active";
    case "completed": return "Closed";
    case "failed": return "Active";
    default: return "New";
  }
}

function buildFeatureDescription(entry: ManifestEntry, planDir: string): string {
  const promptPath = join(planDir, entry.file);
  let promptContent = "";
  if (existsSync(promptPath)) {
    promptContent = readFileSync(promptPath, "utf-8");
  }

  const criteriaMatch = promptContent.match(/##\s+Acceptance Criteria\s*\n([\s\S]*?)(?=\n##|\n$)/m);
  const criteria = criteriaMatch ? criteriaMatch[1].trim() : "";

  let description = `<h2>Feature: ${entry.id}</h2>\n<p>${entry.description}</p>\n`;
  if (criteria) {
    description += `<h3>Acceptance Criteria</h3>\n<pre>${criteria}</pre>\n`;
  }
  description += `<h3>Technical Details</h3>\n<ul>\n`;
  description += `<li><strong>Verification:</strong> <code>${entry.verification}</code></li>\n`;
  description += `<li><strong>Beads ID:</strong> ${entry.beads_id}</li>\n`;
  if (entry.depends_on.length > 0) {
    description += `<li><strong>Dependencies:</strong> ${entry.depends_on.join(", ")}</li>\n`;
  }
  description += `</ul>\n`;

  return description;
}

function buildStoryDescription(summary: string, entries: ManifestEntry[]): string {
  const stats = {
    total: entries.length,
    pending: entries.filter(e => e.status === "pending").length,
    in_progress: entries.filter(e => e.status === "in_progress").length,
    completed: entries.filter(e => e.status === "completed").length,
    failed: entries.filter(e => e.status === "failed").length
  };

  let description = `<h2>Summary</h2>\n<p>${summary}</p>\n`;
  description += `<h2>Progress</h2>\n<table>\n`;
  description += `<tr><td><strong>Total Features</strong></td><td>${stats.total}</td></tr>\n`;
  description += `<tr><td><strong>Completed</strong></td><td>${stats.completed}</td></tr>\n`;
  description += `<tr><td><strong>In Progress</strong></td><td>${stats.in_progress}</td></tr>\n`;
  description += `<tr><td><strong>Pending</strong></td><td>${stats.pending}</td></tr>\n`;
  if (stats.failed > 0) {
    description += `<tr><td><strong>Failed</strong></td><td>${stats.failed}</td></tr>\n`;
  }
  description += `</table>\n`;

  description += `<h2>Features</h2>\n<ul>\n`;
  for (const entry of entries) {
    const icon = entry.status === "completed" ? "[x]" :
                 entry.status === "in_progress" ? "[>]" :
                 entry.status === "failed" ? "[!]" : "[ ]";
    description += `<li>${icon} <strong>${entry.id}:</strong> ${entry.title}</li>\n`;
  }
  description += `</ul>\n`;
  description += `<p><em>Synced from planning system. Beads is source of truth.</em></p>`;

  return description;
}

async function updateWorkItem(
  id: string,
  updates: Record<string, string>,
  config: DevOpsConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    const orgUrl = `https://dev.azure.com/${config.org}`;
    const fields = Object.entries(updates).map(([k, v]) => `${k}=${v}`);
    await $`az boards work-item update --id ${id} --fields ${fields} --org ${orgUrl} --project ${config.project}`.quiet();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.stderr || err.message };
  }
}

async function createTask(
  title: string,
  description: string,
  parentId: string,
  config: DevOpsConfig
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const orgUrl = `https://dev.azure.com/${config.org}`;
    const result = await $`az boards work-item create \
      --type Task --title ${title} --description ${description} \
      --org ${orgUrl} --project ${config.project} --output json`.json();

    if (result.id) {
      await $`az boards work-item relation add \
        --id ${result.id} --relation-type parent --target-id ${parentId} --org ${orgUrl}`.quiet();
    }

    return { success: true, id: String(result.id) };
  } catch (err: any) {
    return { success: false, error: err.stderr || err.message };
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const planDir = args.find(a => !a.startsWith("--"));
  const mode = args.find(a => a.startsWith("--")) || "--status";

  if (!planDir) {
    console.error("Usage: bun run sync-devops.ts <plan-dir> [--full|--status|--create-tasks]");
    process.exit(1);
  }

  console.log("=== Azure DevOps Sync ===\n");

  const config = loadDevOpsConfig(planDir);
  if (!config) {
    console.log("No .devops file found - skipping DevOps sync");
    process.exit(0);
  }

  console.log(`Story ID: ${config.storyId}`);
  console.log(`Org: ${config.org}`);
  console.log(`Project: ${config.project}`);
  console.log(`Mode: ${mode}\n`);

  const { title, summary } = loadPlanMetadata(planDir);
  const entries = readManifest(planDir);

  if (entries.length === 0) {
    console.error("No features found in manifest");
    process.exit(1);
  }

  console.log(`Plan: ${title}`);
  console.log(`Features: ${entries.length}\n`);

  let hasFailures = false;

  if (mode === "--create-tasks") {
    console.log("Creating DevOps tasks for features...\n");
    let created = 0, failed = 0, modified = false;

    for (const entry of entries) {
      if (entry.devops_id) {
        console.log(`  ${entry.id}: Already has DevOps task ${entry.devops_id}`);
        continue;
      }

      console.log(`  ${entry.id}: Creating DevOps task...`);
      const description = buildFeatureDescription(entry, planDir);
      const result = await createTask(`${entry.id}: ${entry.title}`, description, config.storyId, config);

      if (result.success && result.id) {
        entry.devops_id = result.id;
        modified = true;
        created++;
        console.log(`    Created task ${result.id}`);
      } else {
        failed++;
        console.log(`    Failed: ${result.error}`);
      }
    }

    if (modified) {
      writeManifest(planDir, entries);
      console.log("\nManifest updated with DevOps task IDs");
    }

    console.log(`\nCreated: ${created}, Failed: ${failed}`);
    hasFailures = failed > 0;

  } else if (mode === "--full") {
    console.log("Full sync...\n");

    const storyDesc = buildStoryDescription(summary, entries);
    const storyResult = await updateWorkItem(config.storyId, {
      "System.Title": title,
      "System.Description": storyDesc
    }, config);

    if (storyResult.success) {
      console.log("  Story updated");
    } else {
      console.log(`  Story update failed: ${storyResult.error}`);
      hasFailures = true;
    }

    console.log("\nSyncing features...");
    for (const entry of entries) {
      if (!entry.devops_id) {
        console.log(`  ${entry.id}: - No DevOps task`);
        continue;
      }

      const description = buildFeatureDescription(entry, planDir);
      const result = await updateWorkItem(entry.devops_id, {
        "System.Title": `${entry.id}: ${entry.title}`,
        "System.Description": description,
        "System.State": mapStatusToDevOps(entry.status)
      }, config);

      if (result.success) {
        console.log(`  ${entry.id}: OK`);
      } else {
        console.log(`  ${entry.id}: FAILED ${result.error}`);
        hasFailures = true;
      }
    }

  } else {
    console.log("Status sync...\n");

    const storyDesc = buildStoryDescription(summary, entries);
    await updateWorkItem(config.storyId, {
      "System.Title": title,
      "System.Description": storyDesc
    }, config);
    console.log("  Story updated");

    console.log("\nSyncing feature statuses...");
    for (const entry of entries) {
      if (!entry.devops_id) {
        console.log(`  ${entry.id}: - No DevOps task`);
        continue;
      }

      const result = await updateWorkItem(entry.devops_id, {
        "System.State": mapStatusToDevOps(entry.status)
      }, config);

      if (result.success) {
        console.log(`  ${entry.id}: OK ${mapStatusToDevOps(entry.status)}`);
      } else {
        console.log(`  ${entry.id}: FAILED ${result.error}`);
        hasFailures = true;
      }
    }
  }

  console.log("\n=== Sync Complete ===");
  if (hasFailures) {
    console.log("\nWarning: Some items failed to sync");
    process.exit(2);
  }
}

main().catch(err => {
  console.error("Sync error:", err.message);
  process.exit(1);
});
