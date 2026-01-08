/**
 * Version Validation Script
 *
 * Validates that a given version string matches the versions declared in
 * package.json and .claude-plugin/plugin.json.
 *
 * Usage: bun run scripts/validate-version.ts <version>
 *
 * Examples:
 *   bun run scripts/validate-version.ts 1.2.0
 *   bun run scripts/validate-version.ts v1.2.0
 *   bun run scripts/validate-version.ts 2.0.0-beta.1
 *
 * Exit codes:
 * - 0: All versions match
 * - 1: Version mismatch or error
 */

import { file } from "bun";

interface PackageJson {
  version: string;
  [key: string]: unknown;
}

interface PluginJson {
  version: string;
  [key: string]: unknown;
}

interface VersionSource {
  name: string;
  path: string;
  version: string;
}

/**
 * Strip leading 'v' from version string if present
 */
function normalizeVersion(version: string): string {
  return version.startsWith("v") ? version.slice(1) : version;
}

/**
 * Read and parse a JSON file using Bun's native file API
 */
async function readJsonFile<T>(path: string): Promise<T> {
  const f = file(path);
  const exists = await f.exists();
  if (!exists) {
    throw new Error(`File not found: ${path}`);
  }
  const content = await f.text();
  return JSON.parse(content) as T;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("Usage: bun run scripts/validate-version.ts <version>");
    console.error("");
    console.error("Examples:");
    console.error("  bun run scripts/validate-version.ts 1.2.0");
    console.error("  bun run scripts/validate-version.ts v1.2.0");
    console.error("  bun run scripts/validate-version.ts 2.0.0-beta.1");
    process.exit(1);
  }

  const inputVersion = args[0];
  const expectedVersion = normalizeVersion(inputVersion);

  console.log(`Validating version: ${expectedVersion}`);
  console.log("");

  const sources: VersionSource[] = [];
  const errors: string[] = [];

  // Read package.json
  try {
    const packageJson = await readJsonFile<PackageJson>("package.json");
    sources.push({
      name: "package.json",
      path: "package.json",
      version: packageJson.version
    });
  } catch (err) {
    errors.push(`Failed to read package.json: ${(err as Error).message}`);
  }

  // Read .claude-plugin/plugin.json
  try {
    const pluginJson = await readJsonFile<PluginJson>(".claude-plugin/plugin.json");
    sources.push({
      name: "plugin.json",
      path: ".claude-plugin/plugin.json",
      version: pluginJson.version
    });
  } catch (err) {
    errors.push(`Failed to read .claude-plugin/plugin.json: ${(err as Error).message}`);
  }

  // Check for read errors
  if (errors.length > 0) {
    console.error("Errors reading version files:");
    for (const error of errors) {
      console.error(`  - ${error}`);
    }
    process.exit(1);
  }

  // Compare versions
  const mismatches: VersionSource[] = [];

  console.log("Version sources:");
  for (const source of sources) {
    const match = source.version === expectedVersion;
    const status = match ? "OK" : "MISMATCH";
    console.log(`  ${source.name}: ${source.version} [${status}]`);
    if (!match) {
      mismatches.push(source);
    }
  }

  console.log("");

  // Report results
  if (mismatches.length > 0) {
    console.error("Version validation FAILED");
    console.error("");
    console.error(`Expected version: ${expectedVersion}`);
    console.error("");
    console.error("Mismatches:");
    for (const mismatch of mismatches) {
      console.error(`  - ${mismatch.path}: found ${mismatch.version}, expected ${expectedVersion}`);
    }
    process.exit(1);
  }

  console.log("Version validation PASSED");
  console.log(`All files contain version: ${expectedVersion}`);
  process.exit(0);
}

main().catch(err => {
  console.error("Validation error:", err.message);
  process.exit(1);
});
