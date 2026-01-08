---
description: Execute multiple plans in parallel using git worktrees
argument-hint: "<plan-dir-1> <plan-dir-2> [plan-dir-n...]"
---

# Parallel Plan Execution

Execute multiple plans in parallel using git worktrees.

## Before Starting

Read `.claude/skills/planning/SKILL.md` for system overview.

## Input

- Plan directories: $ARGUMENTS (space-separated paths)

## Workflow

1. **Validate inputs**: Confirm all plan directories exist with manifest.jsonl

2. **Load workflow details**: Read `.claude/skills/planning/workflows/4-parallel.md`

3. **Determine merge order**: Analyze dependencies, prioritize by Beads priority

4. **Create worktrees**: One per plan, branching from main

5. **Display execution instructions**: 
   ```
   Open separate Claude Code sessions:
   
   Session 1: cd <worktree-1> && /plan-orchestrate .
   Session 2: cd <worktree-2> && /plan-orchestrate .
   ```

6. **Wait for user confirmation** that all plans are complete

7. **Merge sequentially** in determined order with testing after each

8. **Cleanup**: Remove worktrees, prune branches

## Constraints

- All work stays local until final push
- Merge order respects dependencies
- Full test suite after each merge

## Output

- Integrated main branch with all plans
- Cleaned up worktrees
- Push to remote
