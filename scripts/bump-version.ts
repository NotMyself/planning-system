/**
 * Version Bump Script
 *
 * Synchronizes a version string across all package files:
 * - package.json
 * - .claude-plugin/plugin.json
 *
 * Usage: bun run scripts/bump-version.ts <version> [--dry-run]
 *
 * Examples:
 *   bun run scripts/bump-version.ts 1.2.0
 *   bun run scripts/bump-version.ts v1.2.0
 *   bun run scripts/bump-version.ts 2.0.0-beta.1
 *   bun run scripts/bump-version.ts 1.0.1 --dry-run
 *
 * Exit codes:
 * - 0: Success (or dry-run completed)
 * - 1: Invalid arguments or error
 */

import { file } from "bun";

interface PackageFile {
  name: string;
  path: string;
  version: string;
  content: Record<string, unknown>;
}

/**
 * Strip leading 'v' from version string if present
 */
function normalizeVersion(version: string): string {
  return version.startsWith("v") ? version.slice(1) : version;
}

/**
 * Validate semver format including prerelease suffixes
 * Matches: major.minor.patch[-prerelease][+build]
 * Examples: 1.0.0, 1.2.3-beta.1, 2.0.0-rc.1, 1.0.0-alpha+001
 */
function isValidSemver(version: string): boolean {
  // Semver regex based on semver.org specification
  const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
  return semverRegex.test(version);
}

/**
 * Read and parse a JSON file using Bun's native file API
 */
async function readJsonFile(path: string): Promise<Record<string, unknown>> {
  const f = file(path);
  const exists = await f.exists();
  if (!exists) {
    throw new Error(`File not found: ${path}`);
  }
  const content = await f.text();
  return JSON.parse(content) as Record<string, unknown>;
}

/**
 * Write JSON file with 2-space indentation, preserving formatting
 */
async function writeJsonFile(path: string, content: Record<string, unknown>): Promise<void> {
  const jsonString = JSON.stringify(content, null, 2) + "\n";
  await Bun.write(path, jsonString);
}

function printUsage(): void {
  console.error("Usage: bun run scripts/bump-version.ts <version> [--dry-run]");
  console.error("");
  console.error("Arguments:");
  console.error("  version    Semver version string (e.g., 1.2.0, v1.2.0, 2.0.0-beta.1)");
  console.error("  --dry-run  Preview changes without writing files");
  console.error("");
  console.error("Examples:");
  console.error("  bun run scripts/bump-version.ts 1.2.0");
  console.error("  bun run scripts/bump-version.ts v1.2.0");
  console.error("  bun run scripts/bump-version.ts 2.0.0-beta.1");
  console.error("  bun run scripts/bump-version.ts 1.0.1 --dry-run");
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // Parse arguments
  const dryRun = args.includes("--dry-run");
  const versionArgs = args.filter(arg => arg !== "--dry-run");

  if (versionArgs.length === 0) {
    console.error("Error: Version argument is required");
    console.error("");
    printUsage();
    process.exit(1);
  }

  if (versionArgs.length > 1) {
    console.error("Error: Too many arguments");
    console.error("");
    printUsage();
    process.exit(1);
  }

  const inputVersion = versionArgs[0];
  const newVersion = normalizeVersion(inputVersion);

  // Validate semver format
  if (!isValidSemver(newVersion)) {
    console.error(`Error: Invalid semver format: ${newVersion}`);
    console.error("");
    console.error("Version must follow semver format: major.minor.patch[-prerelease][+build]");
    console.error("Examples: 1.0.0, 1.2.3-beta.1, 2.0.0-rc.1");
    process.exit(1);
  }

  const mode = dryRun ? "DRY RUN" : "UPDATE";
  console.log(`[${mode}] Bumping version to: ${newVersion}`);
  console.log("");

  // Package files to update
  const packagePaths = [
    { name: "package.json", path: "package.json" },
    { name: "plugin.json", path: ".claude-plugin/plugin.json" }
  ];

  const packages: PackageFile[] = [];
  const errors: string[] = [];

  // Read all package files
  for (const pkg of packagePaths) {
    try {
      const content = await readJsonFile(pkg.path);
      const currentVersion = content.version as string | undefined;
      if (typeof currentVersion !== "string") {
        errors.push(`${pkg.path}: missing or invalid 'version' field`);
        continue;
      }
      packages.push({
        name: pkg.name,
        path: pkg.path,
        version: currentVersion,
        content
      });
    } catch (err) {
      errors.push(`Failed to read ${pkg.path}: ${(err as Error).message}`);
    }
  }

  // Check for read errors
  if (errors.length > 0) {
    console.error("Errors reading package files:");
    for (const error of errors) {
      console.error(`  - ${error}`);
    }
    process.exit(1);
  }

  // Report changes
  console.log("Changes:");
  for (const pkg of packages) {
    const action = pkg.version === newVersion ? "unchanged" : `${pkg.version} -> ${newVersion}`;
    console.log(`  ${pkg.name}: ${action}`);
  }
  console.log("");

  // Apply changes if not dry-run
  if (dryRun) {
    console.log("Dry run complete. No files were modified.");
  } else {
    let updatedCount = 0;
    for (const pkg of packages) {
      if (pkg.version !== newVersion) {
        pkg.content.version = newVersion;
        await writeJsonFile(pkg.path, pkg.content);
        updatedCount++;
      }
    }
    console.log(`Updated ${updatedCount} file(s).`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});
