/**
 * Feature Verification
 * 
 * Standalone verification for a specific feature.
 * Used by orchestrator to verify before marking complete.
 * 
 * Usage: bun run verify-feature.ts <feature-id> <plan-dir>
 * 
 * Exit codes:
 * - 0: All checks pass
 * - 1: Verification failed
 */

import { getFeatureById } from "./lib/manifest.ts";
import { runCommand } from "./lib/tests.ts";
import { getRecentCommits } from "./lib/git.ts";

async function main(): Promise<void> {
  const [featureId, planDir] = process.argv.slice(2);
  
  if (!featureId || !planDir) {
    console.error("Usage: bun run verify-feature.ts <feature-id> <plan-dir>");
    process.exit(1);
  }

  const feature = await getFeatureById(planDir, featureId);
  if (!feature) {
    console.error(`Feature ${featureId} not found in manifest`);
    process.exit(1);
  }

  const results = {
    verification: { success: false, output: "" },
    commit: { found: false, message: "" },
    build: { success: false, output: "" }
  };

  // Run feature's verification command
  console.log(`Running verification: ${feature.verification}`);
  results.verification = await runCommand(feature.verification);

  // Check for commit with feature ID
  console.log(`Checking for commit with ${featureId}...`);
  const commits = await getRecentCommits(10);
  const featureCommit = commits.find(c => c.includes(featureId));
  results.commit = {
    found: !!featureCommit,
    message: featureCommit || ""
  };

  // Run build
  console.log("Running build...");
  results.build = await runCommand("bun run build");

  // Report results
  console.log(`\n========================================`);
  console.log(`Feature ${featureId} Verification Results`);
  console.log(`========================================\n`);
  
  console.log(`Verification (${feature.verification}): ${results.verification.success ? "✓ PASS" : "✗ FAIL"}`);
  console.log(`Commit found: ${results.commit.found ? "✓ YES" : "✗ NO"}`);
  console.log(`Build: ${results.build.success ? "✓ PASS" : "✗ FAIL"}`);

  const allPassed = results.verification.success && results.commit.found && results.build.success;
  
  if (!allPassed) {
    console.log("\n--- Failure Details ---\n");
    if (!results.verification.success) {
      console.log(`Verification output:\n${results.verification.output}\n`);
    }
    if (!results.commit.found) {
      console.log(`No commit containing "${featureId}" in recent history\n`);
      console.log(`Recent commits:\n${commits.join("\n")}\n`);
    }
    if (!results.build.success) {
      console.log(`Build output:\n${results.build.output}\n`);
    }
    process.exit(1);
  }

  console.log("\n✓ All checks passed\n");
  process.exit(0);
}

main().catch(err => {
  console.error("Verification error:", err.message);
  process.exit(1);
});
