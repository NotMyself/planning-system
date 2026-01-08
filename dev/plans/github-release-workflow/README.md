# GitHub Release Workflow - Orchestration Guide

## Overview

This plan implements an automated GitHub release workflow for the planning-system skill.

## Features

| ID | Title | Dependencies | Status |
|----|-------|--------------|--------|
| F001 | Version Validation Script | - | pending |
| F002 | Version Bump Script | - | pending |
| F003 | Release Workflow | F001 | pending |
| F004 | CHANGELOG & Documentation | F003 | pending |

## Execution

Run the orchestrator:

```bash
/plan-orchestrate dev/plans/github-release-workflow/
```

The orchestrator will:
1. Execute features in dependency order
2. Verify each feature before marking complete
3. Update Beads task status
4. Create a PR when all features complete

## Files

| File | Purpose |
|------|---------|
| `manifest.jsonl` | Feature metadata and status |
| `context.md` | Project background |
| `constraints.md` | Global rules |
| `decisions.md` | Decision log |
| `edge-cases.md` | Edge case handling |
| `testing-strategy.md` | Testing approach |
| `prompts/*.md` | Individual feature prompts |

## Beads

- **Epic**: planning-system-vhh
- **Tasks**: planning-system-vhh.1 through planning-system-vhh.4

## Recovery

If interrupted, re-run `/plan-orchestrate`. The system will:
1. Reconcile state from Beads
2. Skip completed features
3. Continue from where it left off
