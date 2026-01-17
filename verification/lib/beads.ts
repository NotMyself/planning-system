/**
 * Beads CLI operations for verification
 */

import { $ } from "bun";
import { existsSync } from "fs";
import { join } from "path";
import { getPluginRoot } from "./paths";

export interface BeadsTask {
  id: string;
  type: string;
  status: string;
  title: string;
}

export interface BeadsItem {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: number;
  issue_type: "epic" | "feature" | "task" | "bug" | "chore";
  owner?: string;
  created_at: string;
  updated_at: string;
  dependencies?: BeadsItem[];
  dependents?: BeadsItem[];
}

/**
 * Get a single item by ID with full details including dependencies/dependents
 */
export async function getItem(id: string): Promise<BeadsItem | null> {
  try {
    const result = await $`bd show ${id} --json`.json();
    if (Array.isArray(result) && result.length > 0) {
      return result[0] as BeadsItem;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get all items currently in_progress
 */
export async function getInProgressItems(): Promise<BeadsItem[]> {
  try {
    const result = await $`bd list --status=in_progress --json`.json();
    if (Array.isArray(result)) {
      return result as BeadsItem[];
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Check if an Epic is a "master plan" epic.
 * A master plan Epic has child Features as dependents (not Tasks).
 */
export async function isMasterPlanEpic(item: BeadsItem): Promise<boolean> {
  if (item.issue_type !== "epic") {
    return false;
  }

  // Get full item with dependents
  const fullItem = await getItem(item.id);
  if (!fullItem || !fullItem.dependents || fullItem.dependents.length === 0) {
    return false;
  }

  // Check if it has Feature children
  const hasFeatureChildren = fullItem.dependents.some(
    (dep) => dep.issue_type === "feature"
  );

  // Check if it has NO direct Task children (tasks should be under features in master plan)
  const hasDirectTaskChildren = fullItem.dependents.some(
    (dep) => dep.issue_type === "task"
  );

  // It's a master plan if it has Features and no direct Tasks
  return hasFeatureChildren && !hasDirectTaskChildren;
}

/**
 * Check if a Feature has been properly planned.
 * A Feature is "planned" if:
 * - Description contains ## Objective or ## Summary (required)
 * - Description contains ## Implementation or ## Approach (required)
 * - Description is at least 500 characters total
 * OR
 * - Supporting files exist at dev/plans/<kebab-name>/
 */
export async function isFeaturePlanned(feature: BeadsItem): Promise<boolean> {
  if (feature.issue_type !== "feature") {
    return true; // Non-features bypass this check
  }

  // Check for supporting files first
  const kebabName = toKebabCase(feature.title);
  const plansDir = join(getPluginRoot(), "dev", "plans", kebabName);
  if (existsSync(plansDir)) {
    return true;
  }

  const description = feature.description || "";

  // Check for required markers
  const hasObjective =
    description.includes("## Objective") ||
    description.includes("## Summary") ||
    description.includes("## Overview");
  const hasImplementation =
    description.includes("## Implementation") ||
    description.includes("## Approach") ||
    description.includes("## Deliverables");
  const hasMinimumLength = description.length >= 500;

  return hasObjective && hasImplementation && hasMinimumLength;
}

/**
 * Check if a Feature has been optimized (decomposed into tasks).
 * A Feature is "optimized" if:
 * - Has Task children in Beads
 * OR
 * - Has supporting files at dev/plans/<kebab-name>/
 */
export async function isFeatureOptimized(feature: BeadsItem): Promise<boolean> {
  if (feature.issue_type !== "feature") {
    return true; // Non-features bypass this check
  }

  // Check for supporting files
  const kebabName = toKebabCase(feature.title);
  const plansDir = join(getPluginRoot(), "dev", "plans", kebabName);
  if (existsSync(plansDir)) {
    return true;
  }

  // Check for Task children
  const fullItem = await getItem(feature.id);
  if (!fullItem || !fullItem.dependents) {
    return false;
  }

  const hasTaskChildren = fullItem.dependents.some(
    (dep) => dep.issue_type === "task"
  );

  return hasTaskChildren;
}

/**
 * Get the parent Feature of a Task, if any.
 * Returns the first Feature found in the item's dependencies.
 */
export async function getParentFeature(
  item: BeadsItem
): Promise<BeadsItem | null> {
  if (item.issue_type !== "task") {
    return null;
  }

  const fullItem = await getItem(item.id);
  if (!fullItem || !fullItem.dependencies) {
    return null;
  }

  // Find the first Feature in dependencies
  for (const dep of fullItem.dependencies) {
    if (dep.issue_type === "feature") {
      // Get full details of the feature
      return await getItem(dep.id);
    }
  }

  return null;
}

/**
 * Check if a task is a research task (allowed before planning).
 * Research tasks have titles starting with "Research:"
 */
export function isResearchTask(item: BeadsItem): boolean {
  if (item.issue_type !== "task") {
    return false;
  }
  return item.title.toLowerCase().startsWith("research:");
}

/**
 * Convert a title to kebab-case for directory names.
 * Removes special characters and converts to lowercase.
 */
function toKebabCase(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Collapse multiple hyphens
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
}

export async function getTaskStatus(taskId: string): Promise<string> {
  try {
    const result = await $`bd show ${taskId} --json`.json();
    if (Array.isArray(result) && result.length > 0) {
      return result[0].status || "unknown";
    }
    return "unknown";
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
