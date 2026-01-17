/**
 * Configuration module for reflect toggle state management
 *
 * Manages the .reflect-state.json file which stores:
 * - Toggle state for automatic reflection mode
 * - Last reflection timestamp
 * - Total learnings count
 *
 * The state file is gitignored as toggle state is user-specific.
 */

import { z } from "zod";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const ReflectStateSchema = z.object({
  enabled: z.boolean(),
  lastReflection: z.string().nullable(),
  totalLearnings: z.number().int().nonnegative(),
});

export type ReflectState = z.infer<typeof ReflectStateSchema>;

const DEFAULT_STATE: ReflectState = {
  enabled: false,
  lastReflection: null,
  totalLearnings: 0,
};

const STATE_FILENAME = ".reflect-state.json";

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
      // Reached filesystem root without finding git, use cwd
      return process.cwd();
    }

    currentDir = parentDir;
  }
}

/**
 * Returns path to .reflect-state.json in the git root directory
 */
export function getStatePath(): string {
  return join(findGitRoot(), STATE_FILENAME);
}

/**
 * Loads reflect state from file, returns defaults if missing or corrupted
 */
export function loadState(): ReflectState {
  const statePath = getStatePath();

  if (!existsSync(statePath)) {
    return { ...DEFAULT_STATE };
  }

  try {
    const content = readFileSync(statePath, "utf-8");
    const parsed = JSON.parse(content);
    const validated = ReflectStateSchema.parse(parsed);
    return validated;
  } catch (err) {
    // EC07: Toggle State File Corrupted - Reset to defaults, don't crash
    console.warn(`Warning: Could not load ${STATE_FILENAME}, using defaults`);
    return { ...DEFAULT_STATE };
  }
}

/**
 * Saves reflect state to file
 */
export function saveState(state: ReflectState): void {
  const statePath = getStatePath();
  const content = JSON.stringify(state, null, 2);
  writeFileSync(statePath, content, "utf-8");
}

/**
 * Returns whether automatic reflection is enabled
 */
export function isEnabled(): boolean {
  return loadState().enabled;
}

/**
 * Updates the enabled flag for automatic reflection
 */
export function setEnabled(enabled: boolean): void {
  const state = loadState();
  state.enabled = enabled;
  saveState(state);
}

/**
 * Records a reflection session, updating timestamp and learnings count
 */
export function recordReflection(learningsCount: number): void {
  const state = loadState();
  state.lastReflection = new Date().toISOString();
  state.totalLearnings += learningsCount;
  saveState(state);
}
