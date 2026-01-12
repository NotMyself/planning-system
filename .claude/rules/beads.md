# Beads Issue Tracking Rules

This project uses **bd** (beads) for issue tracking. Run `bd onboard` to get started.

## Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --status=in_progress  # Claim work
bd close <id>         # Complete work
bd sync               # Sync with git
```

## Issue Hierarchy

- **Epic** → **Feature** → **Task** (parent to child)
- **Bug** can be assigned to any level (task, feature, or epic)
- Work MUST be associated with an item type unless explicitly told otherwise

## Status Propagation

- When working on a task under a feature, mark the feature as `in_progress`
- When working on a feature under an epic, mark the epic as `in_progress`
- Status flows UP the hierarchy - child work activates parent status

## Parent Assignment

- If asked to create an item with no parent specified, assume the deepest nested `in_progress` item as parent
- ASK the user to confirm the parent before creating
- If adding a child to a CLOSED parent, REOPEN the parent first
- Associate items with parent using `bd dep add <issue> <parent>`

## Bug Filing

- When asked to file a bug, ASK which `in_progress` item it should go under (epic, feature, or task)
- Present the current `in_progress` items as options

## Issue Creation

- Always include `--description="..."` when creating issues
- Descriptions must explain WHY the issue exists and WHAT needs to be done
- NEVER create issues without descriptions
- If `bd create` warns about missing description, immediately update with `bd update <id> --description="..."`
- Use appropriate type: `task`, `feature`, `bug`, `epic`
- Priority: 0-4 (0=critical, 2=medium, 4=backlog)

## Current Active Epics

- `web-notmyself-io-48z` - Content & Site Features
- `web-notmyself-io-2u8` - Deployment & Infrastructure

## Session Completion ("Landing the Plane")

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
