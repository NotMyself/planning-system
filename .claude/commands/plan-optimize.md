---
description: Optimize a plan for sub-agent implementation
argument-hint: "<plan-file-path>"
---

# Optimize Plan

Transform a plan into feature prompts optimized for sub-agent execution.

## Before Starting

Read `.claude/skills/planning/SKILL.md` for system overview.

## Input

- Plan file: $ARGUMENTS (e.g., `dev/plans/my-feature/plan.md`)
- Output directory: Parent of plan file

## Workflow

1. **Validate input**: Confirm plan file exists, read `.beads` file for epic ID

2. **Load workflow details**: Read `.claude/skills/planning/workflows/2-optimization.md`

3. **Follow the workflow**:
   - Decompose plan into features
   - Create manifest.jsonl with Beads task IDs
   - Generate feature prompts
   - Create supporting files (context.md, constraints.md, etc.)

4. **Verify output**: All files created, manifest valid, Beads tasks created

## Constraints

- One feature per prompt file
- Each feature must have Beads task as child of epic
- Manifest must be valid JSONL with all required fields

## Output

Files in `<plan-directory>/`:
- `manifest.jsonl` - Feature metadata
- `context.md`, `constraints.md`, `decisions.md`, `edge-cases.md`
- `testing-strategy.md`, `README.md`
- `prompts/*.md` - Individual feature prompts

## Next

User runs `/plan-orchestrate <plan-directory>/`
