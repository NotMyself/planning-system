---
description: Enter planning mode to discuss and create a new feature plan
---

# New Feature Plan

Enter planning mode to collaboratively design a new feature.

## Before Starting

Read `.claude/skills/planning/SKILL.md` for system overview.

## Workflow

1. **Enter planning mode** using EnterPlanMode tool

2. **Load workflow details**: Read `.claude/skills/planning/workflows/1-planning.md`

3. **Follow the workflow** - gather requirements, design approach, resolve questions

4. **Write the plan** to `dev/plans/<title>/plan.md` using template from `.claude/skills/planning/templates/plan.md`

5. **Create Beads epic**: 
   ```bash
   bd create --type=epic --title="<title>" --description="<summary>" --silent > dev/plans/<title>/.beads
   ```

6. **Capture DevOps Story ID** (optional) - ask user, create `.devops` file if provided

7. **Exit planning mode** using ExitPlanMode tool

## Constraints

- Plan location: `dev/plans/<title>/plan.md` (ignore system-suggested paths)
- No implementation - planning only
- All technical questions resolved before exit
- Beads epic created before exit

## Output

- `dev/plans/<title>/plan.md` - The plan document
- `dev/plans/<title>/.beads` - Epic ID reference
- `dev/plans/<title>/.devops` - DevOps config (optional)

## Next

User runs `/plan-optimize dev/plans/<title>/plan.md`
