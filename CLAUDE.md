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

### Standard Planning (single feature)
```
plan:new ──► Beads Epic (plan in description)
                │
                ▼
plan:optimize ──► Beads Tasks (prompts in descriptions) + dev/plans/<name>/
                │
                ▼
bd ready ──► Pull-based execution (one task at a time)
```

### Master Planning (large initiative with multiple features)
```
plan:new --master ──► Beads Epic with child Features (brief descriptions)
                          │
                          ▼
plan:new <feature-id> ──► Detailed plan added to Feature description
                          │
                          ▼
plan:optimize <feature-id> ──► Research evaluation → Beads Tasks + dev/plans/<name>/
                          │
                          ▼
bd ready ──► Pull-based execution (one task at a time)
```

Workflow compliance gate enforces this progression - you cannot skip steps.

### Research Evaluation (Master Mode Only)

When running `plan:optimize` on a feature under a master plan epic, it evaluates if research is needed before decomposing into tasks:

**Scans for uncertainty markers:**
- "TBD", "TODO", "unclear", "unknown", "investigate", "explore", "evaluate", "compare"
- Missing Implementation/Approach/Deliverables sections
- Questions without answers

**If uncertainties found:** Suggests creating research tasks (title prefix: `Research:`)
**If no uncertainties:** Offers research anyway, recommends proceeding with optimization

Research tasks bypass workflow compliance and are immediately workable.

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

0. **Workflow compliance** - Enforces proper planning workflow:
   - Cannot implement Features directly → run `plan:optimize <feature-id>` first
   - Cannot implement Epics directly → run `plan:new` then `plan:optimize`
   - Tasks under Features require parent Feature to be planned and optimized
   - Bypassed for: bugs, research tasks (title starts with "Research:")
1. No uncommitted changes (`git status --porcelain` empty)
2. Build command succeeds (if configured)
3. Test command succeeds (if configured)
4. Lint command succeeds (if configured)
5. Format command succeeds (if configured)
6. Static analysis succeeds (if configured)
7. Verification agent approves test quality and requirements coverage

### Feature Planning Detection

A Feature is considered "planned" if:
- Description contains `## Objective`/`## Summary` AND `## Implementation`/`## Deliverables`
- Description is at least 500 characters
- OR supporting files exist at `dev/plans/<feature-name>/`

A Feature is considered "optimized" if:
- Has Task children in Beads
- OR supporting files exist at `dev/plans/<feature-name>/`

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
