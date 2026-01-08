# Feature: <ID> - <Title>

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
- **<D0X>**: <Decision> — <Why it matters here>

## Edge Cases

From `edge-cases.md`:
- **<EC0X>**: <Case> → <Required handling>

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

Implements: <ID>
Decisions: <relevant-decision-ids>"
```

## Next

After verification passes, this feature is complete. The orchestrator will proceed to the next feature.
