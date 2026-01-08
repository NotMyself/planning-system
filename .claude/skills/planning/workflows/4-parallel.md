# Parallel Execution Workflow

Detailed instructions for the `/plan-parallel` command.

## Step 1: Validate Arguments

Parse $ARGUMENTS as space-separated plan directories.

For each directory:
- Verify it exists
- Verify manifest.jsonl exists
- Read .beads file to get epic ID
- Get epic info: `bd show <epic-id>`

## Step 2: Analyze Merge Order

Collect epic metadata:
- Priority (P0-P4)
- Dependencies (from `depends_on` field)
- Title

Sort by:
1. Priority (P0/P1 first)
2. Dependencies (dependencies before dependents)
3. Alphabetical (tiebreaker)

Display proposed order:
```
Merge order:
1. plan-a (P1) - no dependencies
2. plan-b (P2) - depends on plan-a
3. plan-c (P2) - no dependencies
```

Ask user to confirm.

## Step 3: Create Worktrees

For each plan:

```bash
PLAN_NAME=$(basename $PLAN_DIR)
WORKTREE_PATH="../$(basename $PWD)-$PLAN_NAME"
BRANCH_NAME="plan/$PLAN_NAME"

git worktree add $WORKTREE_PATH -b $BRANCH_NAME
```

Initialize each worktree:
```bash
cd $WORKTREE_PATH
bun install
```

## Step 4: Display Execution Instructions

```
Parallel execution requires separate Claude Code sessions.

Session 1 ($PLAN_1):
  cd $WORKTREE_1
  /plan-orchestrate .

Session 2 ($PLAN_2):
  cd $WORKTREE_2
  /plan-orchestrate .

When all complete, return here and type: done
```

Wait for user to confirm "done".

## Step 5: Verify Completions

For each worktree:
```bash
cd $WORKTREE_PATH
git status --porcelain  # Should be empty
git log --oneline -5    # Should show feature commits
```

Report any issues. Ask user how to proceed if problems found.

## Step 6: Sequential Merge

Return to main repo:
```bash
cd $ORIGINAL_DIR
git checkout main
git pull
```

For each plan in merge order:

```bash
# Rebase onto current main
cd $WORKTREE_PATH
git fetch origin main
git rebase origin/main

# Handle conflicts if any
# ...

# Return and merge
cd $ORIGINAL_DIR
git merge $BRANCH_NAME --no-ff -m "Merge: $PLAN_NAME"

# Run tests
bun test
bun run build
```

If tests fail, report to user and ask: fix, skip, or abort.

## Step 7: Final Push

```bash
bd sync
git push
```

## Step 8: Cleanup

```bash
# Remove worktrees
for WORKTREE in $WORKTREE_PATHS; do
  git worktree remove $WORKTREE
done

# Delete branches
for BRANCH in $BRANCH_NAMES; do
  git branch -d $BRANCH
done

# Prune
git worktree prune
```

## Summary Report

```
Parallel Execution Complete

Merged:
✓ plan-a (3 features)
✓ plan-b (5 features)

Worktrees cleaned: 2
Branches removed: 2

All changes pushed to origin/main.
```
