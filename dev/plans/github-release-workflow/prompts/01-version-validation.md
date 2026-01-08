# Feature: F001 - Version Validation Script

## Context

See `context.md` for project background and architecture.

## Prior Work

This is the first feature - no prior work required.

## Objective

Create a TypeScript script (`scripts/validate-version.ts`) that validates a given version string matches the versions declared in `package.json` and `.claude-plugin/plugin.json`.

> **Scope Constraint**: It is unacceptable to implement features beyond this task's scope. Complete ONLY this feature.

## Relevant Decisions

From `decisions.md`:
- **D05**: Semver versioning — Script should parse and validate semver format

## Edge Cases

From `edge-cases.md`:
- **EC01**: Tag doesn't match version files → Exit with code 1 and clear error message listing mismatches

## Files to Create/Modify

| File | Purpose |
|------|---------|
| `scripts/validate-version.ts` | Create version validation script |

## Implementation Details

The script should:

1. Accept a version string as CLI argument (e.g., `1.2.0` or `v1.2.0`)
2. Strip leading `v` if present
3. Read `package.json` and extract `version` field
4. Read `.claude-plugin/plugin.json` and extract `version` field
5. Compare all versions - they must match exactly
6. Exit 0 if all match, exit 1 with detailed mismatch report if not

Use Bun's native file APIs for reading JSON files.

## Acceptance Criteria

- [ ] Script accepts version as first CLI argument
- [ ] Handles both `v1.2.0` and `1.2.0` format input
- [ ] Reads version from `package.json`
- [ ] Reads version from `.claude-plugin/plugin.json`
- [ ] Exits 0 when all versions match input
- [ ] Exits 1 with mismatch details when versions don't match
- [ ] Edge case EC01 handled

## Verification

```bash
bun run scripts/validate-version.ts 0.1.0
```

Run this command. Only claim completion if it succeeds (exit code 0).

## Commit

```bash
git add scripts/validate-version.ts
git commit -m "feat(release): add version validation script

Implements: F001
Decisions: D05"
```

## Next

After verification passes, this feature is complete. The orchestrator will proceed to the next feature.
