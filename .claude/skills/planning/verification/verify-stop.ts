/**
 * Stop Hook Verification
 * 
 * Runs when Claude attempts to stop responding during orchestration.
 * Blocks completion if quality gates not met.
 * 
 * Exit codes:
 * - 0: Allow stop
 * - 2: Block stop (stderr fed back to Claude)
 */

import { checkUncommittedChanges, getRecentCommits } from "./lib/git.ts";
import { runCommand } from "./lib/tests.ts";
import { getCurrentFeature } from "./lib/manifest.ts";

const PLAN_DIR = process.env.PLAN_DIR || ".";

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

  process.exit(0);
}

main().catch(err => {
  console.error("Verification error:", err.message);
  process.exit(2);
});
