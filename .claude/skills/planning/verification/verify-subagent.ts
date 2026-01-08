/**
 * SubagentStop Hook Verification
 * 
 * Runs when a sub-agent completes. Validates claimed work before accepting.
 * 
 * Exit codes:
 * - 0: Accept sub-agent completion
 * - 2: Reject (stderr fed back to orchestrator)
 */

import { checkUncommittedChanges, getRecentCommits, getDiff } from "./lib/git.ts";
import { runCommand } from "./lib/tests.ts";

async function main(): Promise<void> {
  const errors: string[] = [];

  // Get the sub-agent's transcript/output from environment or stdin
  const transcript = process.env.CLAUDE_SUBAGENT_OUTPUT || "";

  // Check if sub-agent claimed tests passed
  if (transcript.includes("tests pass") || transcript.includes("verification succeeded")) {
    // Actually run the tests
    const testResult = await runCommand("bun test");
    if (!testResult.success) {
      errors.push("Sub-agent claimed tests pass, but they fail:\n" + testResult.output);
    }
  }

  // Check if sub-agent claimed to commit
  if (transcript.includes("committed") || transcript.includes("git commit")) {
    const uncommitted = await checkUncommittedChanges();
    if (uncommitted.length > 0) {
      errors.push("Sub-agent claimed to commit, but uncommitted changes exist:\n" + uncommitted.join("\n"));
    }
  }

  // Verify actual code changes exist
  const diff = await getDiff("HEAD~1", "HEAD");
  if (diff.trim().length === 0) {
    errors.push("No code changes detected in latest commit");
  }

  if (errors.length > 0) {
    console.error("Sub-agent verification failed:\n");
    console.error(errors.join("\n\n"));
    process.exit(2);
  }

  process.exit(0);
}

main().catch(err => {
  console.error("Sub-agent verification error:", err.message);
  process.exit(2);
});
