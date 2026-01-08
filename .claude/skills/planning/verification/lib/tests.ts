/**
 * Test and build runners for verification
 */

import { $ } from "bun";

export interface CommandResult {
  success: boolean;
  output: string;
}

export async function runCommand(command: string): Promise<CommandResult> {
  try {
    const result = await $`sh -c ${command}`.text();
    return { success: true, output: result };
  } catch (err: any) {
    return { success: false, output: err.stderr || err.message };
  }
}

export async function runBuild(): Promise<CommandResult> {
  return runCommand("bun run build");
}

export async function runLint(): Promise<CommandResult> {
  return runCommand("bun run lint");
}

export async function runTests(): Promise<CommandResult> {
  return runCommand("bun test");
}
