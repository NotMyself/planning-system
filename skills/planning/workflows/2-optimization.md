# Optimization Phase Workflow

Detailed instructions for the `plan:optimize` command.

## Step 1: Load Item and Detect Type

1. Fetch the item: `bd show <id>`
2. Detect the item type from the output (epic or feature)
3. Read plan content from item description
4. Verify item is open or in_progress

**Type Detection:**
- Look for `Type: epic` or `Type: feature` in the `bd show` output
- Alternatively use: `bd show <id> --json` and parse the `type` field

**Branch based on type:**
- **If type is `epic`**: Continue with [Epic Optimization Workflow](#epic-optimization-workflow) below
- **If type is `feature`**: Jump to [Feature Optimization Workflow](#feature-optimization-workflow)

---

# Epic Optimization Workflow

Use this workflow when optimizing an **epic** into tasks. This is the standard workflow for standalone plans.

## Step 2: Create Plan Directory

1. Generate kebab-case name from epic title:
   - "User Authentication" → `user-authentication`
   - "API Rate Limiting" → `api-rate-limiting`

2. Create directory: `dev/plans/<name>/`

## Step 3: Analyze Plan

Extract from the plan:

- Requirements list
- Implementation approach sections
- Files to modify
- Edge cases
- Testing strategy
- Decisions made

## Step 4: Create Supporting Files

Generate these files in `dev/plans/<name>/`:

**context.md** - Project rationale, architecture vision (from plan summary)

**constraints.md** - Global rules:
```markdown
# Global Constraints

- Complete one feature at a time
- Run verification before claiming complete
- Commit after each feature
- Reference feature IDs in commits
```

**decisions.md** - Decision log from plan (ID, decision, rationale)

**edge-cases.md** - Edge cases from plan (ID, case, handling, related features)

**testing-strategy.md** - Testing approach from plan

## Step 5: Decompose into Features

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

## Step 6: Create Beads Tasks with Prompts

For each feature, create a task under the epic with the **full prompt in the description**:

```bash
bd create --type=task \
  --parent=<epic-id> \
  --title="F001: <feature-title>" \
  --description="<full-prompt-content>" \
  --silent
```

### Prompt Content Template

Each task description should contain:

```markdown
# Feature: F001 - <Title>

**Supporting files:** `dev/plans/<name>/`

## Context
See `context.md` for project background and architecture.

## Prior Work
Features completed before this one:
- <F00X>: <What it established>

## Objective
<Single, clear statement of what this feature accomplishes>

> **Scope Constraint**: It is unacceptable to implement features beyond this task's scope. Complete ONLY this feature.

## Relevant Decisions
From `decisions.md`:
- **D0X**: <Decision> — <Why it matters here>

## Edge Cases
From `edge-cases.md`:
- **EC0X**: <Case> → <Required handling>

## Files to Create/Modify
| File | Purpose |
|------|---------|
| `path/to/file.ts` | What to create or change |

## Implementation Details
<Specific guidance, patterns to follow, interfaces to implement>

## Acceptance Criteria
- [ ] <Testable requirement 1>
- [ ] <Testable requirement 2>
- [ ] Edge case <EC0X> handled
- [ ] Tests pass: `<test command>`

## Verification
```bash
<verification-command>
```
Run this command. Only claim completion if it succeeds.

## Commit
```bash
git add <files>
git commit -m "feat(<scope>): <description>

Implements: F001"
```
```

Store task IDs for dependency setup.

## Step 7: Set Up Dependencies

Use `bd dep add` to establish dependencies between features:

```bash
# F002 depends on F001 (F001 must complete before F002)
bd dep add <task-id-F002> <task-id-F001>
```

This ensures `bd ready` only shows tasks with no blockers.

## Step 8: Update Epic with README

Update the epic description to append README content:

```bash
bd update <epic-id> --description="<original-plan>

---

## Execution Guide

### Features
| ID | Title | Depends On |
|----|-------|------------|
| F001 | ... | - |
| F002 | ... | F001 |
| F003 | ... | F001, F002 |

### Workflow
\`\`\`bash
bd ready                                    # Find available work
bd show <task-id>                           # Review task (prompt in description)
bd update <task-id> --status=in_progress    # Claim work
# ... do the work ...
bd close <task-id>                          # Complete
\`\`\`

### Supporting Files
Location: \`dev/plans/<name>/\`
- context.md - Project background
- constraints.md - Global rules
- decisions.md - Architectural decisions
- edge-cases.md - Edge case catalog
- testing-strategy.md - Testing approach
"
```

## Step 9: Validate Output

Verify all created:

- [ ] `dev/plans/<name>/` directory exists
- [ ] context.md, constraints.md, decisions.md, edge-cases.md, testing-strategy.md exist
- [ ] Beads tasks created under epic
- [ ] Each task has full prompt in description
- [ ] Dependencies established with `bd dep add`
- [ ] Epic description updated with README content

## Step 10: DevOps Task Creation (Optional)

If DevOps integration is needed:

```bash
bun run --cwd ${CLAUDE_PLUGIN_ROOT}/verification sync-devops.ts <epic-id> --create-tasks
```

## Complete

The epic is now optimized. User can begin execution with `bd ready`.

---

# Feature Optimization Workflow

Use this workflow when optimizing a **feature** into tasks. Features typically come from master planning and have their detailed plan in the description.

## Step 2: Load Feature Context

1. **Fetch parent epic** (if exists):
   ```bash
   bd show <parent-epic-id>
   ```

2. **Check for existing supporting files**:
   - If parent epic was optimized, `dev/plans/<epic-name>/` may already exist
   - Reuse existing supporting files when available

3. **If no supporting files exist**, create them in `dev/plans/<feature-name>/`

## Step 2.5: Evaluate Research Needs

Before decomposing into tasks, evaluate if research is needed.

**Check for research indicators in description:**

1. **Scan for uncertainty markers:**
   - "TBD", "TODO", "unclear", "unknown", "investigate", "explore", "evaluate", "compare"
   - Questions without answers ("how to", "which library", "what approach")
   - Missing sections (no Implementation/Approach/Deliverables)
   - Technology choices not made
   - Dependencies on external systems not yet understood
   - Performance/scaling requirements without clear approach

2. **If research indicators found:**

   Tell the user:
   > This feature may benefit from research before optimization.
   >
   > **Detected uncertainties:**
   > - <list specific uncertainties found>
   >
   > Would you like to create research tasks to explore these areas first?

   Use AskUserQuestion with options:
   - "Yes, create research tasks"
   - "No, proceed with optimization"

   If yes → Ask for research topic(s), create research tasks, exit
   If no → Proceed with optimization (continue to Step 3)

3. **If no research indicators found:**

   Tell the user:
   > This feature appears ready for optimization - no research gaps detected.
   >
   > Would you like to create research tasks anyway?

   Use AskUserQuestion with options:
   - "No, proceed with optimization" (Recommended)
   - "Yes, I want to research something first"

   If yes → Ask for research topic(s), create research tasks, exit
   If no → Proceed with optimization (continue to Step 3)

**Creating Research Tasks:**

If user wants research:
1. Ask: "What topic(s) should the research cover?"
2. Create research task(s) under the feature:
   ```bash
   bd create --type=task \
     --parent=<feature-id> \
     --title="Research: <topic>" \
     --description="Explore <topic> to inform feature implementation."
   ```
3. Remove blocking dependency so research tasks are immediately workable:
   ```bash
   bd dep remove <research-task-id> <feature-id>
   ```
   (The `--parent` flag creates a blocking dependency; research tasks should be workable before the parent feature is complete)
4. Tell user: "Research tasks created. Run `bd ready` to start research. When complete, run `plan:optimize <feature-id>` again."
5. Exit (do not proceed with optimization)

**Research Task Completion Flow:**

When a research task is completed, the parent Feature's description should be updated with a link to the research document:

1. Research task is created under Feature (Feature stays `open`, not `in_progress`)
2. User marks research task as `in_progress` and executes it
3. Research produces a document (e.g., `dev/plans/<feature-name>/research/<topic>.md`)
4. When research task is closed, Feature description is updated:
   ```
   ## Research Completed
   - [<topic>](dev/plans/<feature-name>/research/<topic>.md) - <summary>
   ```
5. User runs `plan:optimize <feature-id>` again to proceed

> **Note:** Research tasks bypass workflow compliance checks (via `isResearchTask()`). The Feature does NOT need to be `in_progress` to work on research tasks.

## Step 3: Analyze Feature Plan

Extract from the feature's detailed plan (in its description):

- Feature requirements
- Implementation approach
- Files to modify
- Edge cases specific to this feature
- Testing strategy

## Step 4: Create/Update Supporting Files

If supporting files don't exist from parent epic optimization:

1. Generate kebab-case name from feature title
2. Create directory: `dev/plans/<name>/`
3. Generate supporting files as in Epic Optimization Step 4

If supporting files exist from parent:
- Append feature-specific edge cases to `edge-cases.md`
- Append feature-specific decisions to `decisions.md`
- Update other files as needed

## Step 5: Decompose into Tasks

Break the feature into discrete, testable tasks following progressive disclosure:

**Layer 1 - Foundation**: Types, configuration, constants (no dependencies)
**Layer 2 - Infrastructure**: Core utilities, helpers
**Layer 3 - Core Logic**: Business logic, main functionality
**Layer 4 - Integration**: Wiring, composition
**Layer 5 - Validation**: Tests, E2E verification

Each task should:

- Have ONE clear objective
- Be completable in a single session
- Have concrete acceptance criteria
- Have a verification command

## Step 6: Create Beads Tasks with Prompts

For each task, create under the **feature** (not epic):

```bash
bd create --type=task \
  --parent=<feature-id> \
  --title="T001: <task-title>" \
  --description="<full-prompt-content>" \
  --silent
```

### Prompt Content Template

Same template as Epic Optimization Step 6, but reference the feature:

```markdown
# Task: T001 - <Title>

**Feature:** <feature-name>
**Supporting files:** `dev/plans/<name>/`

## Context
See `context.md` for project background and architecture.

## Feature Context
This task is part of feature: <feature-title>
Feature objective: <feature objective from plan>

## Prior Work
Tasks completed before this one:
- <T00X>: <What it established>

## Objective
<Single, clear statement of what this task accomplishes>

> **Scope Constraint**: It is unacceptable to implement beyond this task's scope. Complete ONLY this task.

## Relevant Decisions
From `decisions.md`:
- **D0X**: <Decision> — <Why it matters here>

## Edge Cases
From `edge-cases.md`:
- **EC0X**: <Case> → <Required handling>

## Files to Create/Modify
| File | Purpose |
|------|---------|
| `path/to/file.ts` | What to create or change |

## Implementation Details
<Specific guidance, patterns to follow, interfaces to implement>

## Acceptance Criteria
- [ ] <Testable requirement 1>
- [ ] <Testable requirement 2>
- [ ] Edge case <EC0X> handled
- [ ] Tests pass: `<test command>`

## Verification
```bash
<verification-command>
```
Run this command. Only claim completion if it succeeds.

## Commit
```bash
git add <files>
git commit -m "feat(<scope>): <description>

Implements: T001 (Feature: <feature-id>)"
```
```

Store task IDs for dependency setup.

## Step 7: Set Up Dependencies

Use `bd dep add` to establish dependencies between tasks:

```bash
# T002 depends on T001 (T001 must complete before T002)
bd dep add <task-id-T002> <task-id-T001>
```

This ensures `bd ready` only shows tasks with no blockers.

## Step 8: Update Feature with README

Update the feature description to append execution guide:

```bash
bd update <feature-id> --description="<original-detailed-plan>

---

## Execution Guide

### Tasks
| ID | Title | Depends On |
|----|-------|------------|
| T001 | ... | - |
| T002 | ... | T001 |
| T003 | ... | T001, T002 |

### Workflow
\`\`\`bash
bd ready                                    # Find available work
bd show <task-id>                           # Review task (prompt in description)
bd update <task-id> --status=in_progress    # Claim work
# ... do the work ...
bd close <task-id>                          # Complete
\`\`\`

### Supporting Files
Location: \`dev/plans/<name>/\`
"
```

## Step 9: Validate Output

Verify all created:

- [ ] Supporting files exist (created or reused from parent)
- [ ] Beads tasks created under feature
- [ ] Each task has full prompt in description
- [ ] Dependencies established with `bd dep add`
- [ ] Feature description updated with execution guide

## Step 10: DevOps Task Creation (Optional)

Same as Epic Optimization Step 10.

## Complete

The feature is now optimized into tasks. User can begin execution with `bd ready`.
