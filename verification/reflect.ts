#!/usr/bin/env bun
/**
 * Reflect - Learn from conversation patterns
 *
 * Usage:
 *   bun run reflect.ts [transcript-path]
 *   bun run reflect.ts on|off|status
 *
 * If no transcript path, reads from stdin or uses CLAUDE_TRANSCRIPT env var.
 */

import { createInterface } from "readline";
import { readFileSync, existsSync } from "fs";
import { analyzeConversation } from "./lib/reflect-agent";
import {
  loadState,
  setEnabled,
  isEnabled,
  recordReflection,
} from "./lib/reflect-config";
import {
  Learning,
  ensureSkillFile,
  formatLearningsSection,
  appendToSkillFile,
  gitCommitChanges,
  isGitAvailable,
} from "./lib/reflect-utils";

/**
 * Prompts user for input
 */
async function prompt(question: string): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

/**
 * Reads transcript from various sources
 */
async function getTranscript(arg?: string): Promise<string | null> {
  // From file path argument
  if (arg && existsSync(arg)) {
    return readFileSync(arg, "utf-8");
  }

  // From CLAUDE_TRANSCRIPT env var
  if (process.env.CLAUDE_TRANSCRIPT) {
    return process.env.CLAUDE_TRANSCRIPT;
  }

  // From stdin (if not a TTY)
  if (!process.stdin.isTTY) {
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString("utf-8");
  }

  return null;
}

/**
 * Displays learnings grouped by confidence
 */
function displayLearnings(learnings: Learning[]): void {
  const grouped = {
    high: learnings.filter((l) => l.confidence === "high"),
    medium: learnings.filter((l) => l.confidence === "medium"),
    low: learnings.filter((l) => l.confidence === "low"),
  };

  console.log("\n=== Detected Learnings ===\n");

  if (grouped.high.length > 0) {
    console.log(`HIGH CONFIDENCE (${grouped.high.length}):`);
    grouped.high.forEach((l, i) => {
      console.log(`  ${i + 1}. ${l.rule}`);
      console.log(`     Evidence: "${l.evidence}"\n`);
    });
  }

  if (grouped.medium.length > 0) {
    console.log(`MEDIUM CONFIDENCE (${grouped.medium.length}):`);
    grouped.medium.forEach((l, i) => {
      console.log(`  ${i + 1}. ${l.rule}`);
      console.log(`     Evidence: "${l.evidence}"\n`);
    });
  }

  if (grouped.low.length > 0) {
    console.log(`LOW CONFIDENCE (${grouped.low.length}):`);
    grouped.low.forEach((l, i) => {
      console.log(`  ${i + 1}. ${l.rule}`);
      console.log(`     Evidence: "${l.evidence}"\n`);
    });
  }
}

/**
 * Generates commit message for learnings
 */
function generateCommitMessage(learnings: Learning[]): string {
  const counts = {
    high: learnings.filter((l) => l.confidence === "high").length,
    medium: learnings.filter((l) => l.confidence === "medium").length,
    low: learnings.filter((l) => l.confidence === "low").length,
  };

  const parts: string[] = [];
  if (counts.high > 0) parts.push(`${counts.high} high confidence`);
  if (counts.medium > 0) parts.push(`${counts.medium} medium confidence`);
  if (counts.low > 0) parts.push(`${counts.low} low confidence`);

  return `docs(reflect): add learned preferences from session

- ${parts.join("\n- ")}`;
}

/**
 * Handles status command
 */
function handleStatus(): void {
  const state = loadState();
  console.log("\n=== Reflect Status ===\n");
  console.log(`Automatic mode: ${state.enabled ? "ENABLED" : "DISABLED"}`);
  console.log(
    `Last reflection: ${state.lastReflection || "Never"}`
  );
  console.log(`Total learnings: ${state.totalLearnings}`);
  console.log();
}

/**
 * Handles on command
 */
function handleOn(): void {
  setEnabled(true);
  console.log("Automatic reflection mode ENABLED");
  console.log("Reflection will run automatically at session end.");
}

/**
 * Handles off command
 */
function handleOff(): void {
  setEnabled(false);
  console.log("Automatic reflection mode DISABLED");
}

/**
 * Main analysis flow
 */
async function handleAnalysis(transcript: string): Promise<number> {
  console.log("Analyzing conversation...");

  const result = await analyzeConversation(transcript);

  if (result.skipped) {
    console.log(`Reflection skipped: ${result.skipReason}`);
    return 0;
  }

  if (result.learnings.length === 0) {
    console.log("No learnings detected in this conversation.");
    return 0;
  }

  // Display learnings
  displayLearnings(result.learnings);

  // Get skill file path
  const skillFile = ensureSkillFile();
  const markdownContent = formatLearningsSection(result.learnings);
  const commitMessage = generateCommitMessage(result.learnings);

  // Show proposed changes
  console.log("=== Proposed Changes ===\n");
  console.log(`File: ${skillFile}\n`);
  console.log(markdownContent);

  // Show commit message
  console.log("=== Commit Message ===\n");
  console.log(commitMessage);
  console.log();

  // Prompt for approval
  const answer = await prompt("Apply these learnings? (y/n): ");

  if (answer !== "y" && answer !== "yes") {
    console.log("Cancelled. No changes made.");
    return 1;
  }

  // Apply changes
  try {
    appendToSkillFile(skillFile, markdownContent);
    console.log(`Updated: ${skillFile}`);

    // Try to commit
    if (await isGitAvailable()) {
      const commitResult = await gitCommitChanges(skillFile, commitMessage);
      if (commitResult.success) {
        console.log("Changes committed to git.");
      } else {
        console.log(`Git commit skipped: ${commitResult.error}`);
      }
    } else {
      console.log("Git not available, changes saved locally.");
    }

    // Record reflection
    recordReflection(result.learnings.length);
    console.log(
      `\nDone! ${result.learnings.length} learnings saved.`
    );

    return 0;
  } catch (err: any) {
    console.error(`Error applying changes: ${err.message}`);
    return 2;
  }
}

/**
 * Main entry point
 */
async function main(): Promise<number> {
  const args = process.argv.slice(2);
  const command = args[0]?.toLowerCase();

  // Handle toggle commands
  if (command === "on") {
    handleOn();
    return 0;
  }

  if (command === "off") {
    handleOff();
    return 0;
  }

  if (command === "status") {
    handleStatus();
    return 0;
  }

  // Analysis mode
  const transcript = await getTranscript(args[0]);

  if (!transcript) {
    console.error("No transcript provided.");
    console.error("Usage: bun run reflect.ts [transcript-path]");
    console.error("       bun run reflect.ts on|off|status");
    console.error("       echo 'transcript' | bun run reflect.ts");
    return 2;
  }

  return handleAnalysis(transcript);
}

// Handle Ctrl+C gracefully
process.on("SIGINT", () => {
  console.log("\nCancelled.");
  process.exit(1);
});

// Run main
main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(`Fatal error: ${err.message}`);
    process.exit(2);
  });
