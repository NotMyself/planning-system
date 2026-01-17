/**
 * Utility functions for skill file operations and git commit helpers
 *
 * Handles:
 * - Finding and creating skill files in .claude/ directory
 * - Formatting learnings as markdown sections
 * - Git operations for committing changes
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { $ } from "bun";

export interface Learning {
  confidence: "high" | "medium" | "low";
  rule: string;
  evidence: string;
  date: string;
}

/**
 * Finds the git root directory starting from the given directory
 */
function findGitRoot(startDir: string = process.cwd()): string {
  let currentDir = startDir;

  while (true) {
    const gitDir = join(currentDir, ".git");
    if (existsSync(gitDir)) {
      return currentDir;
    }

    const parentDir = join(currentDir, "..");
    if (parentDir === currentDir) {
      return process.cwd();
    }

    currentDir = parentDir;
  }
}

/**
 * Finds a skill file in the .claude/ directory
 * @param targetSkill - Optional skill name to match
 * @returns Path to skill file or null if not found
 */
export function findSkillFile(targetSkill?: string): string | null {
  const gitRoot = findGitRoot();
  const claudeDir = join(gitRoot, ".claude");

  if (!existsSync(claudeDir)) {
    return null;
  }

  try {
    const files = readdirSync(claudeDir).filter((f) => f.endsWith(".md"));

    if (files.length === 0) {
      return null;
    }

    if (targetSkill) {
      const match = files.find(
        (f) =>
          f.toLowerCase().includes(targetSkill.toLowerCase()) ||
          f.toLowerCase() === `${targetSkill.toLowerCase()}.md`
      );
      if (match) {
        return join(claudeDir, match);
      }
    }

    // Return first skill file found
    return join(claudeDir, files[0]);
  } catch {
    return null;
  }
}

/**
 * Ensures a skill file exists, creating .claude/learnings.md if needed
 * @returns Path to the skill file
 */
export function ensureSkillFile(): string {
  const existing = findSkillFile();
  if (existing) {
    return existing;
  }

  const gitRoot = findGitRoot();
  const claudeDir = join(gitRoot, ".claude");
  const learningsPath = join(claudeDir, "learnings.md");

  // Create .claude directory if needed
  if (!existsSync(claudeDir)) {
    mkdirSync(claudeDir, { recursive: true });
  }

  // Create learnings.md with header
  const initialContent = `# Learned Preferences

This file contains preferences learned from conversations with Claude Code.

`;
  writeFileSync(learningsPath, initialContent, "utf-8");

  return learningsPath;
}

/**
 * Formats learnings as a markdown section grouped by confidence
 */
export function formatLearningsSection(learnings: Learning[]): string {
  if (learnings.length === 0) {
    return "";
  }

  const grouped = {
    high: learnings.filter((l) => l.confidence === "high"),
    medium: learnings.filter((l) => l.confidence === "medium"),
    low: learnings.filter((l) => l.confidence === "low"),
  };

  const sections: string[] = [];
  sections.push("## Learned Preferences\n");

  if (grouped.high.length > 0) {
    sections.push("### High Confidence\n");
    for (const learning of grouped.high) {
      sections.push(`- **[${learning.date}]** ${learning.rule}`);
      sections.push(`  - _Evidence: "${learning.evidence}"_\n`);
    }
  }

  if (grouped.medium.length > 0) {
    sections.push("### Medium Confidence\n");
    for (const learning of grouped.medium) {
      sections.push(`- **[${learning.date}]** ${learning.rule}`);
      sections.push(`  - _Evidence: "${learning.evidence}"_\n`);
    }
  }

  if (grouped.low.length > 0) {
    sections.push("### Low Confidence\n");
    for (const learning of grouped.low) {
      sections.push(`- **[${learning.date}]** ${learning.rule}`);
      sections.push(`  - _Evidence: "${learning.evidence}"_\n`);
    }
  }

  return sections.join("\n");
}

/**
 * Appends content to a skill file
 * @param filePath - Path to the skill file
 * @param content - Content to append
 */
export function appendToSkillFile(filePath: string, content: string): void {
  try {
    // Create parent directory if needed
    const dir = dirname(filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    if (existsSync(filePath)) {
      const existing = readFileSync(filePath, "utf-8");
      writeFileSync(filePath, existing + "\n" + content, "utf-8");
    } else {
      writeFileSync(filePath, content, "utf-8");
    }
  } catch (err: any) {
    // EC08: Skill File Write Fails - Show error message, don't crash
    console.error(`Error writing to skill file: ${err.message}`);
    throw new Error(`Failed to write to skill file: ${err.message}`);
  }
}

/**
 * Checks if git is available and cwd is a repository
 */
export async function isGitAvailable(): Promise<boolean> {
  try {
    await $`git rev-parse --git-dir`.quiet();
    return true;
  } catch {
    return false;
  }
}

/**
 * Commits changes to a file with git
 * @param filePath - Path to the file to commit
 * @param message - Commit message
 * @returns Success status and optional error message
 */
export async function gitCommitChanges(
  filePath: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  // EC03: Git Not Available - Apply changes locally, skip commit
  if (!(await isGitAvailable())) {
    return { success: false, error: "Git not available or not in a repository" };
  }

  try {
    await $`git add ${filePath}`.quiet();
    await $`git commit -m ${message}`.quiet();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Git commit failed" };
  }
}
