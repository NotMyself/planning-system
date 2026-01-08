# Optimization Phase Workflow

Detailed instructions for the `/plan-optimize` command.

## Step 1: Validate Input

1. Read the plan file from $ARGUMENTS
2. Read `.beads` file to get epic ID
3. Verify epic exists: `bd show <epic-id>`

## Step 2: Analyze Plan

Extract from the plan:

- Requirements list
- Implementation approach sections
- Files to modify
- Edge cases
- Testing strategy
- Decisions made

## Step 3: Decompose into Features

Break the plan into discrete, testable features following progressive disclosure:

**Layer 1 - Foundation**: Types, configuration, constants (no dependencies)
**Layer 2 - Infrastructure**: Core utilities, helpers
**Layer 3 - Core Logic**: Business logic, main functionality
**Layer 4 - Integration**: Wiring, composition
**Layer 5 - Validation**: Tests, E2E verification

Each feature should:

- Have ONE clear objective
- Be completable in a single session
- Have concrete acceptance criteria
- Have a verification command

## Step 4: Create Beads Tasks

For each feature, create a task under the epic:

```bash
TASK_ID=$(bd create --type=task \
  --parent=<epic-id> \
  --title="<feature-id>: <feature-title>" \
  --description="<acceptance-criteria>" \
  --silent)
```

Store task IDs for manifest creation.

## Step 5: Generate Manifest

Create `manifest.jsonl` with one JSON object per line.

Load template from `.claude/skills/planning/templates/manifest.jsonl` for field reference.

Required fields:

```json
{
  "id": "F001",
  "file": "prompts/01-setup-types.md",
  "title": "Setup core types",
  "description": "Create TypeScript interfaces and types",
  "depends_on": [],
  "status": "pending",
  "verification": "bun run tsc --noEmit",
  "beads_id": "<task-id-from-step-4>"
}
```

## Step 6: Generate Feature Prompts

For each feature, create `prompts/NN-<slug>.md`.

Load template from `.claude/skills/planning/templates/prompt.md`.

Each prompt must include:

- Feature ID and title
- Prior work references
- Single clear objective
- Scope constraint: "It is unacceptable to implement features beyond this task's scope."
- Relevant decisions from plan
- Edge cases to handle
- Files to create/modify
- Acceptance criteria
- Verification command
- Commit message format

## Step 7: Create Supporting Files

Generate these files in the plan directory:

**context.md** - Project rationale, architecture vision (from plan summary)

**constraints.md** - Global rules:
```markdown
# Global Constraints

- One feature per session
- Run verification before claiming complete
- Commit after each feature
- Reference decision IDs in commits
```

**decisions.md** - Decision log from plan (ID, decision, rationale)

**edge-cases.md** - Edge cases from plan (ID, case, handling, related features)

**testing-strategy.md** - Testing approach from plan

**README.md** - Orchestration guide

## Step 8: Validate Output

Verify all files created:

- [ ] manifest.jsonl exists and valid JSON per line
- [ ] Each manifest entry has beads_id
- [ ] All referenced prompt files exist
- [ ] context.md, constraints.md, decisions.md, edge-cases.md exist
- [ ] testing-strategy.md, README.md exist

## Step 9: DevOps Task Creation (Optional)

If `.devops` file exists and you want DevOps task tracking:

```bash
bun run --cwd .claude/skills/planning/verification sync-devops.ts <plan-dir> --create-tasks
```

This creates DevOps tasks linked to the Story for each feature.
