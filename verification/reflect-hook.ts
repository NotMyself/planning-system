#!/usr/bin/env bun
/**
 * Reflect Stop Hook
 *
 * Runs when Claude attempts to stop responding.
 * Only triggers reflection if automatic mode is enabled.
 *
 * Receives hook data via stdin:
 * {
 *   "session_id": "string",
 *   "transcript_path": "/path/to/transcript.jsonl",
 *   "cwd": "string",
 *   "hook_event_name": "string"
 * }
 *
 * Exit codes:
 * - 0: Always (never blocks stop)
 */

import { readFileSync } from "fs";
import { isEnabled, recordReflection } from "./lib/reflect-config";
import { analyzeConversation } from "./lib/reflect-agent";
import {
  ensureSkillFile,
  formatLearningsSection,
  appendToSkillFile,
  gitCommitChanges,
  isGitAvailable,
} from "./lib/reflect-utils";

interface HookInput {
  session_id: string;
  transcript_path: string;
  cwd: string;
  hook_event_name: string;
}

interface TranscriptEntry {
  type: string;
  message?: {
    role: string;
    content: string | Array<{ type: string; text?: string }>;
  };
}

/**
 * Reads hook input from stdin
 */
async function readHookInput(): Promise<HookInput | null> {
  try {
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    const input = Buffer.concat(chunks).toString("utf-8");
    return JSON.parse(input) as HookInput;
  } catch {
    return null;
  }
}

/**
 * Reads transcript JSONL and converts to text format
 */
function readTranscript(transcriptPath: string): string {
  try {
    const content = readFileSync(transcriptPath, "utf-8");
    const lines = content.trim().split("\n");
    const parts: string[] = [];

    for (const line of lines) {
      try {
        const entry = JSON.parse(line) as TranscriptEntry;
        if (entry.type === "message" && entry.message) {
          const role = entry.message.role === "user" ? "User" : "Assistant";
          let text = "";
          if (typeof entry.message.content === "string") {
            text = entry.message.content;
          } else if (Array.isArray(entry.message.content)) {
            text = entry.message.content
              .filter((c) => c.type === "text" && c.text)
              .map((c) => c.text)
              .join("\n");
          }
          if (text) {
            parts.push(`${role}: ${text}`);
          }
        }
      } catch {
        // Skip malformed lines
      }
    }

    return parts.join("\n\n");
  } catch {
    return "";
  }
}

async function main(): Promise<void> {
  // 1. Check if automatic reflection is enabled
  if (!isEnabled()) {
    // Silently exit - reflection is disabled
    process.exit(0);
  }

  // 2. Read hook input from stdin
  const hookInput = await readHookInput();
  if (!hookInput || !hookInput.transcript_path) {
    // No transcript available, skip silently
    process.exit(0);
  }

  // 3. Read and parse transcript
  const transcript = readTranscript(hookInput.transcript_path);
  if (!transcript) {
    // Empty transcript, skip silently
    process.exit(0);
  }

  // 3. Analyze conversation
  const result = await analyzeConversation(transcript);
  if (result.skipped || result.learnings.length === 0) {
    // Nothing to apply, skip silently (EC09)
    process.exit(0);
  }

  // 4. Filter to high-confidence learnings only (for automatic mode)
  const highConfidenceLearnings = result.learnings.filter(
    (l) => l.confidence === "high"
  );
  if (highConfidenceLearnings.length === 0) {
    // No high-confidence learnings, skip silently
    process.exit(0);
  }

  // 5. Display learnings (to stderr so user sees them)
  console.error("\n=== Reflect: Auto-applying High-Confidence Learnings ===");
  for (const learning of highConfidenceLearnings) {
    console.error(`\n  - ${learning.rule}`);
    console.error(`    Evidence: "${learning.evidence}"`);
  }
  console.error();

  // 6. Apply changes (auto-apply in automatic mode - user consented by enabling)
  const skillFile = ensureSkillFile();
  const content = formatLearningsSection(highConfidenceLearnings);
  appendToSkillFile(skillFile, content);

  // 8. Commit if git available
  if (await isGitAvailable()) {
    const commitResult = await gitCommitChanges(
      skillFile,
      `docs(reflect): auto-add ${highConfidenceLearnings.length} high-confidence learnings`
    );

    if (commitResult.success) {
      console.error(`Applied and committed to ${skillFile}`);
    } else {
      console.error(
        `Applied to ${skillFile} (not committed: ${commitResult.error})`
      );
    }
  } else {
    console.error(`Applied to ${skillFile}`);
  }

  // 9. Record reflection in state
  recordReflection(highConfidenceLearnings.length);

  process.exit(0);
}

main().catch((err) => {
  // Never block on errors - just log and exit 0
  console.error("Reflect hook error:", err.message);
  process.exit(0);
});
