import { dirname, join } from "path";

/**
 * Get the plugin root directory.
 * Uses CLAUDE_PLUGIN_ROOT env var when installed as plugin,
 * falls back to parent of verification/ for development mode.
 */
export function getPluginRoot(): string {
  if (process.env.CLAUDE_PLUGIN_ROOT) {
    return process.env.CLAUDE_PLUGIN_ROOT;
  }
  // Development mode: assume we're in verification/lib/
  // Go up two levels to reach plugin root
  return dirname(dirname(import.meta.dir));
}

/**
 * Resolve a path relative to plugin root.
 * Handles both installed and development modes.
 */
export function resolvePluginPath(...segments: string[]): string {
  return join(getPluginRoot(), ...segments);
}

/**
 * Get path to verification scripts directory.
 */
export function getVerificationDir(): string {
  return resolvePluginPath("verification");
}

/**
 * Get path to skills directory.
 */
export function getSkillsDir(): string {
  return resolvePluginPath("skills");
}

// Self-test when run directly
if (import.meta.main) {
  console.log("Plugin Root:", getPluginRoot());
  console.log("Verification Dir:", getVerificationDir());
  console.log("Skills Dir:", getSkillsDir());
}
