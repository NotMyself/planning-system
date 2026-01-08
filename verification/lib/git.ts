/**
 * Git operations for verification scripts
 */

import { $ } from "bun";

export async function checkUncommittedChanges(): Promise<string[]> {
  const result = await $`git status --porcelain`.text();
  return result.trim().split("\n").filter(line => line.length > 0);
}

export async function getRecentCommits(count: number): Promise<string[]> {
  const result = await $`git log --oneline -${count}`.text();
  return result.trim().split("\n").filter(line => line.length > 0);
}

export async function getDiff(from: string, to: string): Promise<string> {
  try {
    const result = await $`git diff ${from} ${to}`.text();
    return result;
  } catch {
    return "";
  }
}

export async function getCurrentBranch(): Promise<string> {
  const result = await $`git branch --show-current`.text();
  return result.trim();
}
