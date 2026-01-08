/**
 * Manifest operations for verification
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";

export interface ManifestEntry {
  id: string;
  file: string;
  title: string;
  description: string;
  depends_on: string[];
  status: "pending" | "in_progress" | "completed" | "failed";
  verification: string;
  beads_id: string;
  devops_id?: string;
}

export function readManifest(planDir: string): ManifestEntry[] {
  const manifestPath = join(planDir, "manifest.jsonl");
  if (!existsSync(manifestPath)) {
    return [];
  }

  const content = readFileSync(manifestPath, "utf-8");
  return content
    .trim()
    .split("\n")
    .filter(line => line.length > 0)
    .map(line => JSON.parse(line) as ManifestEntry);
}

export async function getCurrentFeature(planDir: string): Promise<ManifestEntry | null> {
  const entries = readManifest(planDir);
  return entries.find(e => e.status === "in_progress") || null;
}

export async function getFeatureById(planDir: string, id: string): Promise<ManifestEntry | null> {
  const entries = readManifest(planDir);
  return entries.find(e => e.id === id) || null;
}

export function getPendingFeatures(planDir: string): ManifestEntry[] {
  const entries = readManifest(planDir);
  return entries.filter(e => e.status === "pending");
}

export function getCompletedFeatures(planDir: string): ManifestEntry[] {
  const entries = readManifest(planDir);
  return entries.filter(e => e.status === "completed");
}
