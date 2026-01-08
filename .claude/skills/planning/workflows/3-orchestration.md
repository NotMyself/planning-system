# Orchestration Phase Workflow

Detailed instructions for the `/plan-orchestrate` command.

Includes: Recovery/idempotency, dual-repo PR support, DevOps sync.

## Step 1: Branch Setup

```bash
PLAN_NAME=$(basename $ARGUMENTS)
git checkout -b plan/$PLAN_NAME 2>/dev/null || git checkout plan/$PLAN_NAME
```

## Step 2: State Reconciliation (CRITICAL)

**Run BEFORE any feature processing. This ensures idempotency.**

```bash
bun run --cwd .claude/skills/planning/verification reconcile-state.ts $ARGUMENTS
```

This script:
- Syncs Beads with remote
- Validates manifest structure
- Reconciles Beads ↔ manifest status differences
- Recovers from mid-feature crashes
- Resets failed features for retry

**Exit codes:**
- 0: Safe to proceed
- 1: Unrecoverable error (stop orchestration)
- 2: Issues fixed, re-run reconciliation

If exit code is 2, run reconciliation again before proceeding.

### Recovery Scenarios Handled

| Scenario | Detection | Recovery |
|----------|-----------|----------|
| Crash during feature work | Both in_progress | Check verification → complete or reset |
| Manifest updated, Beads not | Manifest completed, Beads open | Close Beads |
| Beads updated, manifest not | Beads closed, manifest pending | Update manifest |
| Session cleared mid-feature | Beads in_progress, manifest pending | Reset Beads to open |
| Previous failure | Manifest failed | Reset to pending for retry |

## Step 3: Load Context

Read these files from plan directory:

- `manifest.jsonl` - Feature list with status
- `context.md` - Project context
- `constraints.md` - Global rules
- `decisions.md` - Decision reference
- `edge-cases.md` - Edge case reference
- `testing-strategy.md` - Testing approach

## Step 4: DevOps Initial Sync (Optional)

If `.devops` file exists:

```bash
bun run --cwd .claude/skills/planning/verification sync-devops.ts $ARGUMENTS --status
```

This updates the Story with current progress and syncs feature statuses.

## Step 5: Execute Features

For each feature where status is `pending`:

### 5a. Check Dependencies

Verify all `depends_on` features have status `completed`.

If any dependency not complete, process it first.

### 5b. Update Status

```bash
# Update manifest to in_progress
# (The verification scripts handle this atomically)

# Update Beads
bd update $BEADS_ID --status=in_progress
```

### 5c. Spawn Implementation Sub-Agent

Use Task tool:

```
Description: "Implement feature $FEATURE_ID"

Prompt:
Read and implement the feature defined in:
$PLAN_DIR/prompts/$FEATURE_FILE

Context files:
- $PLAN_DIR/context.md
- $PLAN_DIR/constraints.md

Requirements:
1. Follow TDD: Write failing test first, then implement, then refactor
2. Run verification command before claiming complete
3. Commit with message format from prompt
4. Output verification command results in your final response

Scope constraint: Implement ONLY this feature. Do not proceed to other features.
```

**Wait for sub-agent completion.**

### 5d. Spawn Verification Sub-Agent

Use Task tool:

```
Description: "Verify feature $FEATURE_ID"

Prompt:
Verify the implementation of feature $FEATURE_ID:

1. Run the verification command: $VERIFICATION_CMD
   Show the actual output.

2. Check git log for commit containing "$FEATURE_ID"
   Show the commit message.

3. Confirm all acceptance criteria from the prompt are met.
   List each criterion and whether it passes.

4. Report PASS or FAIL with specific findings.

Do NOT fix issues - only report findings.
```

**Wait for verification result.**

### 5e. Run Mechanical Verification

In addition to sub-agent verification, run the verification script:

```bash
bun run --cwd .claude/skills/planning/verification verify-feature.ts $FEATURE_ID $ARGUMENTS
```

This provides mechanical verification independent of sub-agent claims.

### 5f. Process Result

**If PASS (both sub-agent and mechanical):**

```bash
# Update manifest to completed
jq -c "if .id == \"$FEATURE_ID\" then .status = \"completed\" else . end" \
  $PLAN_DIR/manifest.jsonl > tmp && mv tmp $PLAN_DIR/manifest.jsonl

# Close Beads task
bd close $BEADS_ID --reason="Verified: $VERIFICATION_CMD passed"
```

**If FAIL:**

```bash
# Update manifest to failed
jq -c "if .id == \"$FEATURE_ID\" then .status = \"failed\" else . end" \
  $PLAN_DIR/manifest.jsonl > tmp && mv tmp $PLAN_DIR/manifest.jsonl
```

Report failure to user with specific findings. Ask: "Fix and retry, skip, or abort?"

### 5g. DevOps Status Sync (Optional)

After each feature completion:

```bash
bun run --cwd .claude/skills/planning/verification sync-devops.ts $ARGUMENTS --status
```

## Step 6: Final Validation

After all features complete:

1. Run full test suite
2. Run build
3. Run linter
4. Verify all Beads tasks closed: `bd list --parent=<epic-id>`

## Step 7: DevOps Final Sync (Optional)

Full sync with completion details:

```bash
bun run --cwd .claude/skills/planning/verification sync-devops.ts $ARGUMENTS --full
```

## Step 8: Create Pull Request

Use the dual-repo PR script:

```bash
bun run --cwd .claude/skills/planning/verification create-pr.ts $ARGUMENTS plan/$PLAN_NAME
```

This script:
- Detects GitHub vs Azure DevOps from git remote
- Pushes the branch
- Creates PR with plan summary
- Returns PR URL

**Supports:**
- GitHub repos (uses `gh` CLI)
- Azure DevOps repos (uses `az repos` CLI)
- Override via `.planconfig` file

## Step 9: Close Epic

```bash
bd epic close-eligible
bd sync
```

If `.devops` exists and epic closes, close the DevOps Story:

```bash
source $PLAN_DIR/.devops
az boards work-item update $STORY_ID \
  --state Closed \
  --org "https://dev.azure.com/$ORG" \
  --project "$PROJECT"
```

## State Output Requirement

**Output this at the END of every response:**

```
---
## 🎯 Orchestration State
| Metric | Value |
|--------|-------|
| Current Feature | $FEATURE_ID - $STATUS |
| Progress | $COMPLETED / $TOTAL |
| Branch | plan/$PLAN_NAME |
| Last Verification | $PASS_OR_FAIL |

### Pending Features
- $NEXT_FEATURE_ID: $TITLE
```

This keeps task state in attention and creates accountability.

## Error Recovery

If orchestration is interrupted at any point:

1. Re-run `/plan-orchestrate $PLAN_DIR`
2. Reconciliation will detect and recover state
3. Already-completed features will be skipped
4. In-progress features will be reset and retried

The system is designed to be safely re-runnable at any point.
