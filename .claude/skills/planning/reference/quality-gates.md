# Quality Gates Reference

## Feature Completion Gates

A feature is complete when ALL of the following pass:

| Gate | Verification | Blocking |
|------|--------------|----------|
| Verification command | Exit code 0 | Yes |
| Commit exists | Contains feature ID | Yes |
| Build succeeds | `bun run build` | Yes |
| Tests pass | `bun test` | Yes |
| No uncommitted changes | `git status --porcelain` empty | Yes |

## Sub-Agent Acceptance Gates

Before accepting sub-agent completion:

| Claim | Verification |
|-------|--------------|
| "Tests pass" | Actually run `bun test` |
| "Build succeeds" | Actually run `bun run build` |
| "Committed" | Check `git status` for uncommitted changes |
| "Verification passes" | Run the verification command |

## Orchestration PR Gates

Before creating PR:

- [ ] All features have `completed` status
- [ ] No features have `pending` or `in_progress` status
- [ ] Full test suite passes
- [ ] Build is clean
- [ ] Beads state synced (all tasks closed)
- [ ] No uncommitted changes

## Hook Exit Codes

| Code | Meaning | Claude Response |
|------|---------|-----------------|
| 0 | Allow | Continue normally |
| 1 | Error | Report error, may retry |
| 2 | Block | Receives stderr, must fix |

## Verification Command Examples

```bash
# TypeScript type checking
bun run tsc --noEmit

# Run specific test file
bun test src/feature/

# Run build
bun run build

# Run lint
bun run lint

# Combined
bun run tsc --noEmit && bun test && bun run build
```
