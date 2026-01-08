# Beads CLI Quick Reference

## Epic Operations

```bash
# Create epic
bd create --type=epic --title="Title" --description="Desc" --silent

# View epic
bd show <epic-id>
bd show <epic-id> --format=json

# List epic children
bd list --parent=<epic-id>

# Close eligible epics (all children closed)
bd epic close-eligible
```

## Task Operations

```bash
# Create task under epic
bd create --type=task --parent=<epic-id> --title="Title" --silent

# Update status
bd update <task-id> --status=open
bd update <task-id> --status=in_progress

# Close task
bd close <task-id> --reason="Reason"
```

## State Management

```bash
# Sync with remote
bd sync

# View stats
bd stats

# List ready tasks (no blockers)
bd ready

# List blocked tasks
bd blocked
```

## Status Values

- `open` - Not started
- `in_progress` - Currently being worked
- `closed` - Complete
