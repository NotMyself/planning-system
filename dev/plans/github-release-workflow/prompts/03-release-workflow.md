# Feature: F003 - Release Workflow

## Context

See `context.md` for project background and architecture.

## Prior Work

Features completed before this one:
- **F001**: Version validation script — Used by workflow to validate tag matches versions

## Objective

Create a GitHub Actions workflow (`.github/workflows/release.yml`) that triggers on `v*` tag push, validates versions, generates changelog, creates a GitHub Release, and submits a PR to the marketplace repository.

> **Scope Constraint**: It is unacceptable to implement features beyond this task's scope. Complete ONLY this feature.

## Relevant Decisions

From `decisions.md`:
- **D01**: Use `requarks/changelog-action` for changelog — Auto-generates from conventional commits
- **D02**: Direct PR to marketplace (not repository_dispatch) — Simpler setup
- **D03**: Store PAT in GitHub Secrets — Standard secure approach for cross-repo access
- **D04**: No release archive by default — Claude Code installs from git repo directly

## Edge Cases

From `edge-cases.md`:
- **EC01**: Tag doesn't match version files → Validation step fails, release blocked
- **EC02**: Tests fail during release → Release blocked before GitHub Release created
- **EC03**: Marketplace PR fails → Release succeeds, PR creation logged as warning
- **EC04**: Prerelease tag (v1.2.0-beta.1) → Marked as prerelease in GitHub Release

## Files to Create/Modify

| File | Purpose |
|------|---------|
| `.github/workflows/release.yml` | Create release workflow |

## Implementation Details

The workflow should have these jobs/steps:

### Job: release

1. **Checkout** - Checkout with full history for changelog
2. **Setup Bun** - Install Bun runtime
3. **Extract version** - Parse tag to get version (strip `v` prefix)
4. **Validate version** - Run `bun run scripts/validate-version.ts $VERSION`
5. **Install dependencies** - `bun install`
6. **Run tests** - `bun test` (blocks release if fails)
7. **Build** - `bun run build`
8. **Generate changelog** - Use `requarks/changelog-action@v1`
9. **Create GitHub Release** - Use extracted changelog body, mark prerelease if `-` in version
10. **Checkout marketplace** - Clone `NotMyself/claude-dotnet-marketplace` using `MARKETPLACE_PAT`
11. **Update marketplace** - Update version in `plugins/planning-system.json`
12. **Create marketplace PR** - Use `peter-evans/create-pull-request@v6`

### Secrets Required

- `MARKETPLACE_PAT`: Fine-grained PAT with `contents:write` and `pull_requests:write` on marketplace repo

### Trigger

```yaml
on:
  push:
    tags:
      - 'v*'
```

## Acceptance Criteria

- [ ] Workflow triggers on `v*` tag push
- [ ] Validates tag matches package versions (fails if mismatch)
- [ ] Runs tests before release (fails if tests fail)
- [ ] Generates changelog from conventional commits
- [ ] Creates GitHub Release with changelog body
- [ ] Marks prerelease if version contains `-`
- [ ] Creates PR to marketplace repo (with graceful failure handling)
- [ ] Edge cases EC01-EC04 handled

## Verification

```bash
bun run tsc --noEmit
```

Run this command. Only claim completion if it succeeds (TypeScript compiles without errors).

## Commit

```bash
git add .github/workflows/release.yml
git commit -m "feat(release): add GitHub Actions release workflow

Implements: F003
Decisions: D01, D02, D03, D04"
```

## Next

After verification passes, this feature is complete. The orchestrator will proceed to the next feature.
