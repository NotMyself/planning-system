/**
 * Beads CLI operations for verification
 */

import { $ } from "bun";

export interface BeadsTask {
  id: string;
  type: string;
  status: string;
  title: string;
}

export async function getTaskStatus(taskId: string): Promise<string> {
  try {
    const result = await $`bd show ${taskId} --format=json`.json();
    return result.status || "unknown";
  } catch {
    return "unknown";
  }
}

export async function syncBeads(): Promise<void> {
  await $`bd sync`.quiet();
}

export async function closeTask(taskId: string, reason: string): Promise<boolean> {
  try {
    await $`bd close ${taskId} --reason=${reason}`.quiet();
    return true;
  } catch {
    return false;
  }
}

export async function updateTaskStatus(taskId: string, status: string): Promise<boolean> {
  try {
    await $`bd update ${taskId} --status=${status}`.quiet();
    return true;
  } catch {
    return false;
  }
}
