/**
 * Stop Hook Verification
 *
 * Runs when Claude attempts to stop responding.
 * Blocks completion if quality gates not met.
 *
 * Quality gates (in order):
 * 0. Workflow compliance (master planning enforcement)
 * 1. No uncommitted changes
 * 2. Build command (if configured)
 * 3. Test command (if configured)
 * 4. Lint command (if configured)
 * 5. Format command (if configured)
 * 6. Static analysis command (if configured)
 * 7. Verification agent (test quality + requirements)
 *
 * Exit codes:
 * - 0: Allow stop
 * - 2: Block stop (stderr fed back to Claude)
 */

import { checkUncommittedChanges } from "./lib/git";
import { runCommand } from "./lib/tests";
import { loadConfig, getVerificationCommands } from "./lib/config";
import { runVerificationAgent } from "./lib/verification-agent";
import {
  getInProgressItems,
  getParentFeature,
  isFeaturePlanned,
  isFeatureOptimized,
  isMasterPlanEpic,
  isResearchTask,
} from "./lib/beads";

/**
 * Check workflow compliance for master planning enforcement.
 * Blocks completion when:
 * - Trying to implement Features directly (need to optimize first)
 * - Trying to implement Epics directly (need to plan/optimize first)
 * - Task's parent Feature isn't planned or optimized
 */
async function checkWorkflowCompliance(): Promise<{
  passed: boolean;
  issues: string[];
}> {
  const inProgress = await getInProgressItems();
  const issues: string[] = [];

  for (const item of inProgress) {
    // Skip bugs - they bypass master planning checks
    if (item.issue_type === "bug") {
      continue;
    }

    // Block: Cannot implement Features directly
    if (item.issue_type === "feature") {
      issues.push(
        `Cannot implement feature "${item.title}" directly.\n` +
          `Run: plan:optimize ${item.id} to create executable tasks.`
      );
      continue;
    }

    // Block: Cannot implement Epics directly
    if (item.issue_type === "epic") {
      const isMaster = await isMasterPlanEpic(item);
      if (isMaster) {
        issues.push(
          `Cannot implement master plan epic "${item.title}" directly.\n` +
            `First run plan:new <feature-id> for each feature, then plan:optimize.`
        );
      } else {
        issues.push(
          `Cannot implement epic "${item.title}" directly.\n` +
            `Run: plan:optimize ${item.id} to create executable tasks.`
        );
      }
      continue;
    }

    // Task-specific checks
    if (item.issue_type === "task") {
      // Research tasks are allowed before planning
      if (isResearchTask(item)) {
        continue;
      }

      // Check if task's parent Feature is properly planned and optimized
      const parent = await getParentFeature(item);
      if (parent) {
        const planned = await isFeaturePlanned(parent);
        if (!planned) {
          issues.push(
            `Task "${item.title}" belongs to unplanned feature "${parent.title}".\n` +
              `Run: plan:new ${parent.id} before executing tasks.`
          );
          continue;
        }

        const optimized = await isFeatureOptimized(parent);
        if (!optimized) {
          issues.push(
            `Task "${item.title}" belongs to unoptimized feature "${parent.title}".\n` +
              `Run: plan:optimize ${parent.id} before executing tasks.`
          );
        }
      }
      // Tasks without a parent Feature (standard planning) bypass feature-planning checks
    }
  }

  return { passed: issues.length === 0, issues };
}

async function main(): Promise<void> {
  const errors: string[] = [];

  // 0. Check workflow compliance (master planning enforcement)
  const workflow = await checkWorkflowCompliance();
  if (!workflow.passed) {
    errors.push(
      `Workflow compliance failed:\n${workflow.issues.join("\n\n")}`
    );
  }

  // 1. Check for uncommitted changes (always runs)
  const uncommitted = await checkUncommittedChanges();
  if (uncommitted.length > 0) {
    errors.push(`Uncommitted changes:\n${uncommitted.join("\n")}`);
  }

  // Load project config
  const { config, path: configPath, error: configError } = loadConfig();

  if (configError) {
    errors.push(`Configuration error: ${configError}`);
  }

  // 2-6. Run configured verification commands
  if (config) {
    const commands = getVerificationCommands(config);

    for (const { name, command } of commands) {
      const result = await runCommand(command);
      if (!result.success) {
        errors.push(`${name} failed: ${command}\n${result.output}`);
      }
    }
  }

  // 7. Verification agent - check test quality and requirements
  const verificationResult = await runVerificationAgent();
  if (!verificationResult.passed) {
    errors.push(`Verification agent found issues:\n${verificationResult.issues.join("\n")}`);
  }

  if (errors.length > 0) {
    console.error("Cannot complete - quality gates not met:\n");
    console.error(errors.join("\n\n"));
    process.exit(2);
  }

  // All gates passed
  process.exit(0);
}

main().catch(err => {
  console.error("Verification error:", err.message);
  process.exit(2);
});
