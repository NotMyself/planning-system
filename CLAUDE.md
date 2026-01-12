# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a planning and execution system for Claude Code that uses mechanical enforcement (hooks and verification scripts) to ensure quality gates are met. It uses Beads as the source of truth for plans and task state.

## Commands

| Command | Purpose |
|---------|---------|
| `plan:new` | Enter planning mode, create plan and store in Beads epic |
| `plan:optimize <epic-id>` | Decompose plan into features and Beads tasks |

## Setup

```bash
cd verification
bun install
```

## Architecture

```
plan:new ──► Beads Epic (plan in description)
                │
                ▼
plan:optimize ──► Beads Tasks (prompts in descriptions) + dev/plans/<name>/ (supporting files)
                │
                ▼
bd ready ──► Pull-based execution (one task at a time)
```

### Mechanical Enforcement

Hooks in `hooks/hooks.json` intercept Stop events. TypeScript verification scripts in `verification/` check actual state (tests pass, build succeeds, changes committed). Exit code 2 blocks completion and feeds stderr back to Claude.

### Key Files

- `.planconfig` - Project verification commands (YAML, in project root)
- `dev/plans/<name>/` - Supporting files (context.md, constraints.md, decisions.md, edge-cases.md, testing-strategy.md)

### Project Configuration (.planconfig)

```yaml
build_command: "dotnet build"
test_command: "dotnet test"
lint_command: "dotnet format --verify-no-changes"
format_command: "prettier --check ."
static_analysis_command: "sonar-scanner"
```

All commands are optional. If not configured, those verification steps are skipped.

### Verification Scripts

| Script | Purpose |
|--------|---------|
| `verify-stop.ts` | Blocks completion if quality gates fail |
| `create-pr.ts` | Dual-repo PR creation (GitHub or Azure DevOps) |
| `sync-devops.ts` | Sync status with Azure DevOps boards |

## Quality Gates

Work is complete when ALL configured gates pass:
- No uncommitted changes (`git status --porcelain` empty)
- Build command succeeds (if configured)
- Test command succeeds (if configured)
- Lint command succeeds (if configured)
- Format command succeeds (if configured)
- Static analysis succeeds (if configured)
- Verification agent approves test quality and requirements coverage

## Execution Workflow

```bash
bd ready                                    # Find available work
bd show <task-id>                           # Review task (prompt in description)
bd update <task-id> --status=in_progress    # Claim work
# ... do the work ...
# Stop hook runs verification
bd close <task-id>                          # Complete
```

## Dependencies

- Bun runtime
- Git
- Beads CLI (`bd`) - required for state management
- GitHub CLI (`gh`) or Azure CLI (`az`) for PR creation
- ANTHROPIC_API_KEY (optional) - for verification agent
