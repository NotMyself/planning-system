# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a planning and execution system for Claude Code that uses mechanical enforcement (hooks and verification scripts) to ensure sub-agents complete all required steps. It prevents shortcuts like skipping tests or builds.

## Commands

| Command | Purpose |
|---------|---------|
| `/plan-new` | Enter planning mode, create plan in `dev/plans/<title>/plan.md` |
| `/plan-optimize <plan.md>` | Decompose plan into feature prompts and manifest |
| `/plan-orchestrate <plan-dir>` | Execute features with sub-agents |
| `/plan-parallel <dir1> <dir2>` | Execute multiple plans using git worktrees |

## Setup

```bash
cd .claude/skills/planning/verification
bun install
```

## Architecture

```
/plan-new ──► plan.md ──► /plan-optimize ──► manifest.jsonl + prompts/ ──► /plan-orchestrate ──► PR
                              │                                                    │
                              ▼                                                    ▼
                         Beads Epic                                          Beads Tasks
```

### Mechanical Enforcement

Hooks in `.claude/hooks.json` intercept Stop and SubagentStop events. TypeScript verification scripts in `.claude/skills/planning/verification/` check actual state (tests pass, build succeeds, changes committed). Exit code 2 blocks completion and feeds stderr back to Claude.

### Key Files

- `.beads` - Contains Beads epic ID (created by /plan-new)
- `.devops` - Azure DevOps Story config (optional)
- `.planconfig` - PR creation overrides (optional)
- `manifest.jsonl` - Feature metadata with status, dependencies, verification commands

### Verification Scripts

| Script | Purpose |
|--------|---------|
| `verify-stop.ts` | Blocks completion if tests fail or changes uncommitted |
| `verify-subagent.ts` | Audits sub-agent claims before acceptance |
| `verify-feature.ts` | Mechanical feature verification |
| `reconcile-state.ts` | Ensures idempotent orchestration via state recovery |
| `create-pr.ts` | Dual-repo PR creation (GitHub or Azure DevOps) |
| `sync-devops.ts` | Sync status with Azure DevOps boards |

## Quality Gates

Features are complete when ALL pass:
- Verification command exits 0
- Commit contains feature ID
- `bun run build` succeeds
- `bun test` passes
- No uncommitted changes (`git status --porcelain` empty)

## Dependencies

- Bun runtime
- Git
- Beads CLI (`bd`) - required for state management
- GitHub CLI (`gh`) or Azure CLI (`az`) for PR creation
