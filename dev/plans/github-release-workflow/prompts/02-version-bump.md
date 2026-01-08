# Feature: F002 - Version Bump Script

## Context

See `context.md` for project background and architecture.

## Prior Work

This feature runs in parallel with F001 - no dependencies.

## Objective

Create a TypeScript script (`scripts/bump-version.ts`) that synchronizes a version string across all package files (`package.json` and `.claude-plugin/plugin.json`).

> **Scope Constraint**: It is unacceptable to implement features beyond this task's scope. Complete ONLY this feature.

## Relevant Decisions

From `decisions.md`:
- **D05**: Semver versioning — Script should validate semver format before applying

## Edge Cases

From `edge-cases.md`:
- **EC04**: Prerelease tag (v1.2.0-beta.1) → Should be accepted as valid semver

## Files to Create/Modify

| File | Purpose |
|------|---------|
| `scripts/bump-version.ts` | Create version bump/sync script |

## Implementation Details

The script should:

1. Accept a version string as CLI argument (e.g., `1.2.0` or `v1.2.0`)
2. Accept optional `--dry-run` flag to preview changes without writing
3. Strip leading `v` if present
4. Validate semver format (including prerelease suffixes like `-beta.1`)
5. Update `version` field in `package.json`
6. Update `version` field in `.claude-plugin/plugin.json`
7. Report what was changed (or would be changed in dry-run mode)

Use Bun's native file APIs. Preserve JSON formatting (2-space indent).

## Acceptance Criteria

- [ ] Script accepts version as first CLI argument
- [ ] Handles both `v1.2.0` and `1.2.0` format input
- [ ] Validates semver format before writing
- [ ] `--dry-run` flag previews changes without modifying files
- [ ] Updates `package.json` version field
- [ ] Updates `.claude-plugin/plugin.json` version field
- [ ] Preserves JSON formatting (2-space indent)
- [ ] Edge case EC04 handled (prerelease versions work)

## Verification

```bash
bun run scripts/bump-version.ts 0.1.1 --dry-run
```

Run this command. Only claim completion if it succeeds (exit code 0) and shows the changes that would be made.

## Commit

```bash
git add scripts/bump-version.ts
git commit -m "feat(release): add version bump script

Implements: F002
Decisions: D05"
```

## Next

After verification passes, this feature is complete. The orchestrator will proceed to the next feature.
