---
description: Execute an optimized plan with sub-agents
argument-hint: "<plan-directory>"
---

# Orchestrate Plan Execution

Execute features sequentially using sub-agents with verification.

## Before Starting

Read `${CLAUDE_PLUGIN_ROOT}/skills/planning/SKILL.md` for system overview.

## Input

- Plan directory: $ARGUMENTS (e.g., `dev/plans/my-feature/`)

## Workflow

1. **Create/switch to plan branch**: `git checkout -b plan/<plan-name>` or switch if exists

2. **State reconciliation**: Run recovery script
   ```bash
   bun run ${CLAUDE_PLUGIN_ROOT}/verification/reconcile-state.ts $ARGUMENTS
   ```

3. **Load context files**: Read manifest.jsonl, context.md, constraints.md from plan directory

4. **Execute features sequentially**:

   For each pending feature:

   a. Update status to `in_progress` in manifest and Beads

   b. Spawn sub-agent with:
      - Feature prompt content
      - Context from constraints.md
      - Verification requirements from `${CLAUDE_PLUGIN_ROOT}/skills/planning/reference/quality-gates.md`

   c. **Wait for sub-agent completion**

   d. **Verification sub-agent**: Spawn verification agent to audit the work
      - Prompt: "Verify feature <ID> implementation against requirements"
      - Must confirm: tests pass, build succeeds, changes committed

   e. **Mechanical verification**: Run verify-feature.ts script

   f. If verified: Mark `completed` in manifest, close Beads task

   g. If failed: Mark `failed`, report to user, ask how to proceed

   h. Sync DevOps status (if configured)

5. **Final validation**: Run full test suite, sync DevOps

6. **Create PR**: Uses dual-repo support (GitHub or Azure DevOps)
   ```bash
   bun run ${CLAUDE_PLUGIN_ROOT}/verification/create-pr.ts $ARGUMENTS plan/<plan-name>
   ```

## State Output (every response)

Output current state at the end of EVERY response:

```
---
## 🎯 Orchestration State
| Metric | Value |
|--------|-------|
| Current Feature | <current-id> - <status> |
| Progress | <completed> / <total> |
| Branch | plan/<name> |
| Last Verification | <PASS/FAIL> |

### Pending Features
- <next-id>: <title>
```

## Constraints

- Execute ONE feature at a time
- NEVER trust sub-agent claims - always verify mechanically
- NEVER merge to main - create PR only
- Safe to re-run at any point (idempotent)

## Output

- Committed code for each feature
- Updated manifest.jsonl with completion status
- Closed Beads tasks
- Pull request for review
