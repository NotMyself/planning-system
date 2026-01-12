---
name: planning
description: "Comprehensive feature planning and execution system. Provides workflows for creating plans, decomposing into features, and pull-based execution. Uses Beads as source of truth for state management."
---

# Planning System Skill

## Overview

This skill provides a reliable system for planning and executing features. It uses Beads as the source of truth for plans and task state, with mechanical enforcement of quality gates.

## Architecture

```
plan:new ──► Beads Epic (plan in description)
                │
                ▼
plan:optimize ──► Beads Tasks (prompts in descriptions)
                │   + dev/plans/<name>/ (supporting files)
                ▼
bd ready ──► Pull-based execution (one task at a time)
```

## Key Components

| Component | Purpose |
|-----------|---------|
| Commands | Lean workflow coordinators |
| Workflows | Detailed phase instructions (loaded on-demand) |
| Templates | Standardized file formats |
| Verification | TypeScript scripts for mechanical enforcement |
| Hooks | Block shortcuts at Stop events |

## Beads Integration (Required)

All plans are stored in Beads epics. Each feature becomes a task under that epic with the full prompt in the description.

```bash
# Epic created by plan:new (plan content in description)
bd create --type=epic --title="Feature Name" --description="<full plan>" --silent

# Tasks created by plan:optimize (prompts in description)
bd create --type=task --parent=<epic-id> --title="F001: Setup types" --description="<full prompt>" --silent

# Dependencies between features
bd dep add <task-F002> <task-F001>

# Pull-based execution
bd ready                                    # Find available work
bd update <task-id> --status=in_progress    # Claim work
bd close <task-id>                          # Complete work
```

## DevOps Integration (Optional)

Azure DevOps Story status can sync with Beads epic via `sync-devops.ts`.

## Verification System

Hooks in `hooks/hooks.json` run TypeScript verification scripts:

- **Stop hook**: Blocks completion if quality gates fail

Quality gates (all configurable via `.planconfig`):
- No uncommitted changes
- Build command succeeds
- Test command succeeds
- Lint command succeeds
- Format command succeeds
- Static analysis succeeds
- Verification agent approves test quality and requirements

## Quick Reference

| Task | Command |
|------|---------|
| Start new plan | `plan:new` |
| Optimize plan | `plan:optimize <epic-id>` |
| Find work | `bd ready` |
| View task | `bd show <task-id>` |
| Claim work | `bd update <task-id> --status=in_progress` |
| Complete work | `bd close <task-id>` |

## Workflow Files

Load these on-demand during command execution:

- `workflows/1-planning.md` - Planning phase details
- `workflows/2-optimization.md` - Optimization phase details

## Templates

- `templates/plan.md` - Plan document structure
- `templates/prompt.md` - Feature prompt structure
- `templates/context.md` - Context file template
- `templates/constraints.md` - Constraints file template

## Supporting Files

Created by `plan:optimize` in `dev/plans/<name>/`:

- `context.md` - Project background and architecture
- `constraints.md` - Global rules for all features
- `decisions.md` - Architectural decisions log
- `edge-cases.md` - Known edge cases and handling
- `testing-strategy.md` - Testing approach

## Project Configuration

`.planconfig` (YAML, project root):

```yaml
build_command: "npm run build"
test_command: "npm test"
lint_command: "eslint ."
format_command: "prettier --check ."
static_analysis_command: "sonar-scanner"
```

All commands optional. Missing commands skip that verification step.
