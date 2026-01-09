/**
 * Stop Hook Verification
 *
 * Runs when Claude attempts to stop responding during orchestration.
 * Blocks completion if quality gates not met.
 * Also ensures Beads tasks/epics are closed for completed work.
 *
 * Exit codes:
 * - 0: Allow stop
 * - 2: Block stop (stderr fed back to Claude)
 */

import { $ } from "bun";
import { checkUncommittedChanges, getRecentCommits } from "./lib/git";
import { runCommand } from "./lib/tests";
import { getCurrentFeature, getCompletedFeatures } from "./lib/manifest";

const PLAN_DIR = process.env.PLAN_DIR || ".";

async function getBeadsStatus(taskId: string): Promise<string | null> {
  try {
    const result = await $`bd show ${taskId} --json`.json();
    return result.status || null;
  } catch {
    return null;
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

async function closeEligibleEpics(): Promise<void> {
  try {
    await $`bd epic close-eligible`.quiet();
  } catch {
    // Ignore errors - epic may not exist or already closed
  }
}

async function main(): Promise<void> {
  const errors: string[] = [];

  // Check for uncommitted changes
  const uncommitted = await checkUncommittedChanges();
  if (uncommitted.length > 0) {
    errors.push(`Uncommitted changes:\n${uncommitted.join("\n")}`);
  }

  // Check if we're in orchestration mode (manifest exists)
  const feature = await getCurrentFeature(PLAN_DIR);
  if (feature?.status === "in_progress") {
    // Verify the feature's verification command passed
    const verifyResult = await runCommand(feature.verification);
    if (!verifyResult.success) {
      errors.push(`Verification failed: ${feature.verification}\n${verifyResult.output}`);
    }

    // Check for commit with feature ID
    const commits = await getRecentCommits(5);
    const hasFeatureCommit = commits.some(c => c.includes(feature.id));
    if (!hasFeatureCommit) {
      errors.push(`No commit found containing feature ID: ${feature.id}`);
    }
  }

  if (errors.length > 0) {
    console.error("Cannot complete - quality gates not met:\n");
    console.error(errors.join("\n\n"));
    process.exit(2);
  }

  // Close Beads tasks for completed features (mechanical enforcement)
  const completedFeatures = getCompletedFeatures(PLAN_DIR);
  for (const completed of completedFeatures) {
    if (completed.beads_id) {
      const status = await getBeadsStatus(completed.beads_id);
      if (status && status !== "closed") {
        await closeBeadsTask(completed.beads_id, `Stop hook: ${completed.id} completed`);
      }
    }
  }

  // Close any epics where all children are complete
  await closeEligibleEpics();

  process.exit(0);
}

main().catch(err => {
  console.error("Verification error:", err.message);
  process.exit(2);
});
