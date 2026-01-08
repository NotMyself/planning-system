# Planning Phase Workflow

Detailed instructions for the `/plan-new` command.

## Step 1: Gather Requirements

Discuss with the user to understand:

- **Problem**: What they want to solve
- **Behavior**: Desired functionality
- **Constraints**: Technical or business limitations
- **Integration**: How it connects to existing code

### Research Approach

Research the codebase yourself to answer technical questions. Use:

- `Read` tool to examine existing patterns
- `Glob` to find related files
- `Grep` to search for usage patterns
- `WebSearch` for external library documentation

When multiple valid approaches exist, present options with pros/cons. Only ask the user questions requiring their decision.

## Step 2: Design the Approach

1. **Explore codebase** - Identify patterns to follow
2. **List files** - What needs creation/modification
3. **Consider edge cases** - What could go wrong
4. **Draft approach** - Technical implementation strategy

## Step 3: Generate Plan Title

Create a kebab-case title from the discussion:

- `user-authentication`
- `api-rate-limiting`
- `realtime-notifications`

## Step 4: Write the Plan

Create directory and plan file:

```
dev/plans/<title>/plan.md
```

Load template from `.claude/skills/planning/templates/plan.md` and fill in:

- Summary of the feature
- Requirements from discussion
- Implementation approach
- Files to create/modify
- Edge cases and handling
- Testing strategy
- Decisions made and rationale

**Exclude**: Time estimates, effort sizing, approval workflows.

## Step 5: Create Beads Epic

```bash
EPIC_ID=$(bd create --type=epic \
  --title="<Plan Title>" \
  --description="<Summary from plan>" \
  --silent)

echo "$EPIC_ID" > dev/plans/<title>/.beads
```

## Step 6: DevOps Story (Optional)

Ask: "Do you have an Azure DevOps Story ID for this work? (Enter to skip)"

If provided, collect org and project, then create `.devops`:

```bash
# dev/plans/<title>/.devops
STORY_ID=<story-id>
ORG=<org-name>
PROJECT=<project-name>
```

## Pre-Exit Checklist

Before calling ExitPlanMode, verify:

- [ ] All technical questions resolved
- [ ] User approved all design decisions
- [ ] Plan written to correct location
- [ ] Beads epic created
- [ ] `.beads` file contains epic ID
- [ ] DevOps captured (if provided)

## Exit

Call ExitPlanMode. **STOP** - do not implement anything.
