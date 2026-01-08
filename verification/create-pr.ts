/**
 * Pull Request Creation - Dual Repo Support
 *
 * Detects whether the project uses GitHub or Azure DevOps repos
 * and creates PR using the appropriate CLI.
 *
 * Detection order:
 * 1. .planconfig file (explicit override)
 * 2. Git remote URL pattern matching
 *
 * Usage: bun run create-pr.ts <plan-dir> <branch-name>
 *
 * Exit codes:
 * - 0: PR created successfully
 * - 1: Error (missing CLI, auth failure, etc.)
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { $ } from "bun";

type RepoType = "github" | "azuredevops";

interface PlanConfig {
  repoType?: RepoType;
  azureOrg?: string;
  azureProject?: string;
  azureRepoName?: string;
}

interface PrResult {
  success: boolean;
  url?: string;
  error?: string;
}

async function getGitRemoteUrl(): Promise<string> {
  try {
    const result = await $`git remote get-url origin`.text();
    return result.trim();
  } catch {
    return "";
  }
}

function detectRepoType(remoteUrl: string): RepoType {
  if (
    remoteUrl.includes("dev.azure.com") ||
    remoteUrl.includes("visualstudio.com") ||
    remoteUrl.includes("@ssh.dev.azure.com")
  ) {
    return "azuredevops";
  }
  return "github";
}

function parseAzureDevOpsUrl(remoteUrl: string): { org: string; project: string; repo: string } | null {
  let match = remoteUrl.match(/dev\.azure\.com\/([^\/]+)\/([^\/]+)\/_git\/([^\/]+)/);
  if (match) return { org: match[1], project: match[2], repo: match[3] };

  match = remoteUrl.match(/ssh\.dev\.azure\.com:v3\/([^\/]+)\/([^\/]+)\/([^\/]+)/);
  if (match) return { org: match[1], project: match[2], repo: match[3] };

  match = remoteUrl.match(/([^\.]+)\.visualstudio\.com\/([^\/]+)\/_git\/([^\/]+)/);
  if (match) return { org: match[1], project: match[2], repo: match[3] };

  return null;
}

function loadPlanConfig(planDir: string): PlanConfig {
  const configPath = join(planDir, ".planconfig");
  if (!existsSync(configPath)) return {};

  try {
    return JSON.parse(readFileSync(configPath, "utf-8"));
  } catch {
    return {};
  }
}

function loadPlanMetadata(planDir: string): { title: string; summary: string } {
  const planPath = join(planDir, "plan.md");
  if (!existsSync(planPath)) {
    return { title: "Feature Implementation", summary: "" };
  }

  const content = readFileSync(planPath, "utf-8");
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1] : "Feature Implementation";

  const summaryMatch = content.match(/^##\s+Summary\s*\n([\s\S]*?)(?=\n##|\n$)/m);
  const summary = summaryMatch ? summaryMatch[1].trim() : "";

  return { title, summary };
}

function loadManifestStats(planDir: string): { total: number; completed: number } {
  const manifestPath = join(planDir, "manifest.jsonl");
  if (!existsSync(manifestPath)) return { total: 0, completed: 0 };

  const content = readFileSync(manifestPath, "utf-8");
  const entries = content.trim().split("\n").filter(l => l.length > 0).map(l => JSON.parse(l));

  return {
    total: entries.length,
    completed: entries.filter((e: any) => e.status === "completed").length
  };
}

async function checkGitHubCli(): Promise<boolean> {
  try {
    await $`gh --version`.quiet();
    return true;
  } catch {
    return false;
  }
}

async function checkAzureCli(): Promise<boolean> {
  try {
    await $`az --version`.quiet();
    return true;
  } catch {
    return false;
  }
}

async function createGitHubPr(branchName: string, title: string, body: string): Promise<PrResult> {
  try {
    await $`git push -u origin ${branchName}`;
    const result = await $`gh pr create --title ${title} --body ${body}`.text();
    const urlMatch = result.match(/(https:\/\/github\.com\/[^\s]+)/);
    return { success: true, url: urlMatch ? urlMatch[1] : result.trim() };
  } catch (err: any) {
    return { success: false, error: err.stderr || err.message };
  }
}

async function createAzureDevOpsPr(
  branchName: string,
  title: string,
  body: string,
  org: string,
  project: string,
  repo: string
): Promise<PrResult> {
  try {
    await $`git push -u origin ${branchName}`;
    const orgUrl = `https://dev.azure.com/${org}`;
    const result = await $`az repos pr create \
      --title ${title} \
      --description ${body} \
      --source-branch ${branchName} \
      --target-branch main \
      --org ${orgUrl} \
      --project ${project} \
      --repository ${repo} \
      --output json`.json();

    return {
      success: true,
      url: result.url || `${orgUrl}/${project}/_git/${repo}/pullrequest/${result.pullRequestId}`
    };
  } catch (err: any) {
    return { success: false, error: err.stderr || err.message };
  }
}

async function main(): Promise<void> {
  const [planDir, branchName] = process.argv.slice(2);

  if (!planDir || !branchName) {
    console.error("Usage: bun run create-pr.ts <plan-dir> <branch-name>");
    process.exit(1);
  }

  console.log("=== Pull Request Creation ===\n");

  const config = loadPlanConfig(planDir);
  const remoteUrl = await getGitRemoteUrl();

  if (!remoteUrl) {
    console.error("Cannot determine git remote URL");
    process.exit(1);
  }

  console.log(`Remote: ${remoteUrl}`);

  const repoType = config.repoType || detectRepoType(remoteUrl);
  console.log(`Repo type: ${repoType}\n`);

  const { title, summary } = loadPlanMetadata(planDir);
  const stats = loadManifestStats(planDir);

  const prTitle = `feat: ${title}`;
  const prBody = `## Summary

${summary}

## Implementation

- Features: ${stats.completed}/${stats.total} completed
- Plan: \`${planDir}\`
- Branch: \`${branchName}\`

---
*Generated by planning system*`;

  console.log(`PR Title: ${prTitle}`);
  console.log(`Features: ${stats.completed}/${stats.total}\n`);

  let result: PrResult;

  if (repoType === "github") {
    if (!(await checkGitHubCli())) {
      console.error("GitHub CLI (gh) not found. Install: https://cli.github.com/");
      process.exit(1);
    }
    console.log("Creating GitHub PR...");
    result = await createGitHubPr(branchName, prTitle, prBody);
  } else {
    if (!(await checkAzureCli())) {
      console.error("Azure CLI (az) not found. Install: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli");
      process.exit(1);
    }

    const azureInfo = parseAzureDevOpsUrl(remoteUrl);
    const org = config.azureOrg || azureInfo?.org;
    const project = config.azureProject || azureInfo?.project;
    const repo = config.azureRepoName || azureInfo?.repo;

    if (!org || !project || !repo) {
      console.error("Cannot determine Azure DevOps org/project/repo");
      console.error("Add .planconfig with azureOrg, azureProject, azureRepoName");
      process.exit(1);
    }

    console.log(`Azure DevOps: ${org}/${project}/${repo}`);
    console.log("Creating Azure DevOps PR...");
    result = await createAzureDevOpsPr(branchName, prTitle, prBody, org, project, repo);
  }

  if (result.success) {
    console.log(`\nPR created: ${result.url}`);
  } else {
    console.error(`\nPR creation failed: ${result.error}`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});
