# Azure DevOps Integration

## Configuration

Create `.devops` file in plan directory:

```bash
STORY_ID=12345
ORG=myorg
PROJECT=MyProject
```

## Story Updates

```bash
# Load config
source .devops

# Update title/description
az boards work-item update $STORY_ID \
  --title "New Title" \
  --description "New description" \
  --org "https://dev.azure.com/$ORG" \
  --project "$PROJECT"

# Update state
az boards work-item update $STORY_ID \
  --state "Active" \
  --org "https://dev.azure.com/$ORG" \
  --project "$PROJECT"
```

## Task Creation

```bash
# Create task linked to story
az boards work-item create \
  --type "Task" \
  --title "F001: Feature title" \
  --parent $STORY_ID \
  --org "https://dev.azure.com/$ORG" \
  --project "$PROJECT"
```

## State Mapping

| Beads Status | DevOps State |
|--------------|--------------|
| open | New |
| in_progress | Active |
| closed | Closed |

## Sync Script Usage

```bash
# Status-only sync (fast)
bun run sync-devops.ts <plan-dir> --status

# Full sync (descriptions + status)
bun run sync-devops.ts <plan-dir> --full

# Create DevOps tasks for features
bun run sync-devops.ts <plan-dir> --create-tasks
```

## Error Handling

- **Auth failure**: Log warning, continue without sync
- **Invalid Story ID**: Log error, skip DevOps operations
- **Network issues**: Retry once, then continue without sync
