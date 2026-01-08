# Manifest Entry Format

Each line in `manifest.jsonl` is a JSON object with these fields:

## Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Feature identifier (F000, F001, etc.) |
| `file` | string | Path to prompt file relative to plan directory |
| `title` | string | Short feature title |
| `description` | string | What this feature accomplishes |
| `depends_on` | string[] | Feature IDs that must complete first |
| `status` | string | `pending`, `in_progress`, `completed`, `failed` |
| `verification` | string | Command to verify completion |
| `beads_id` | string | Beads task ID for this feature |

## Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `devops_id` | string | Azure DevOps task ID (if using DevOps sync) |

## Example Entries

```jsonl
{"id":"F000","file":"init.md","title":"Initialize project structure","description":"Set up base configuration and dependencies","depends_on":[],"status":"pending","verification":"bun run tsc --noEmit","beads_id":"abc-123"}
{"id":"F001","file":"prompts/01-core-types.md","title":"Define core types","description":"Create TypeScript interfaces and type definitions","depends_on":["F000"],"status":"pending","verification":"bun run tsc --noEmit","beads_id":"def-456"}
{"id":"F002","file":"prompts/02-api-client.md","title":"Implement API client","description":"Create HTTP client with error handling","depends_on":["F001"],"status":"pending","verification":"bun test src/api/","beads_id":"ghi-789"}
```

## Status Transitions

```
pending ──► in_progress ──► completed
                │
                └──► failed ──► pending (on retry)
```

## Notes

- One JSON object per line (JSONL format)
- No trailing commas
- Feature IDs should be sequential (F000, F001, F002...)
- F000 is typically initialization/setup
- Dependencies create execution order constraints
