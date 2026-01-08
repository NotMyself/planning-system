---
name: planning
description: "Comprehensive feature planning, optimization, and orchestration system. Provides workflows for creating plans, decomposing into features, and executing with sub-agents. Integrates with Beads for state management and optionally Azure DevOps."
---

# Planning System Skill

## Overview

This skill provides a reliable system for planning and executing features using Claude Code sub-agents. It emphasizes mechanical enforcement over instruction compliance.

## Architecture

```
/plan-new ──► plan.md ──► /plan-optimize ──► manifest.jsonl + prompts/ ──► /plan-orchestrate ──► PR
                              │                                                    │
                              ▼                                                    ▼
                         Beads Epic                                          Beads Tasks
```

## Key Components

| Component | Purpose |
|-----------|---------|
| Commands | Lean workflow coordinators (~50 lines each) |
| Workflows | Detailed phase instructions (loaded on-demand) |
| Templates | Standardized file formats |
| Verification | TypeScript scripts for mechanical enforcement |
| Hooks | Block shortcuts at Stop and SubagentStop events |

## Beads Integration (Required)

All plans create a Beads epic. Each feature becomes a task under that epic. State reconciliation syncs manifest.jsonl with Beads status for crash recovery.

```bash
# Epic created by /plan-new
bd create --type=epic --title="Feature Name" --silent

# Tasks created by /plan-optimize  
bd create --type=task --parent=<epic-id> --title="F001: Setup types" --silent

# Status updates by /plan-orchestrate
bd update <task-id> --status=in_progress
bd close <task-id> --reason="Verified and committed"
```

## DevOps Integration (Optional)

If `.devops` file exists in plan directory, Story status syncs with Beads epic:

```bash
# .devops file format
STORY_ID=12345
ORG=myorg
PROJECT=MyProject
```

## Dual-Repo Support

PR creation supports both GitHub and Azure DevOps repos. Detection is automatic from git remote URL, with override via `.planconfig`.

## Verification System

Hooks in `.claude/hooks.json` run TypeScript verification scripts:

- **Stop hook**: Blocks completion if tests fail or changes uncommitted
- **SubagentStop hook**: Audits sub-agent claims before accepting
- **reconcile-state.ts**: Ensures idempotent orchestration
- **verify-feature.ts**: Mechanical feature verification

## Quick Reference

| Task | Command |
|------|---------|
| Start new plan | `/plan-new <description>` |
| Optimize plan | `/plan-optimize dev/plans/<title>/plan.md` |
| Execute plan | `/plan-orchestrate dev/plans/<title>/` |
| Parallel execution | `/plan-parallel <dir1> <dir2>` |

## Workflow Files

Load these on-demand during command execution:

- `workflows/1-planning.md` - Planning phase details
- `workflows/2-optimization.md` - Optimization phase details
- `workflows/3-orchestration.md` - Orchestration phase details
- `workflows/4-parallel.md` - Parallel execution details

## Templates

- `templates/plan.md` - Plan document structure
- `templates/manifest.jsonl` - Manifest entry format
- `templates/prompt.md` - Feature prompt structure

## Reference

- `reference/beads-patterns.md` - Beads CLI commands
- `reference/devops-patterns.md` - Azure DevOps integration
- `reference/quality-gates.md` - Verification requirements

## Recovery

The system is fully idempotent. Re-running `/plan-orchestrate` at any point:
1. Runs state reconciliation
2. Skips completed features
3. Resets and retries interrupted features
4. Continues from where it left off
