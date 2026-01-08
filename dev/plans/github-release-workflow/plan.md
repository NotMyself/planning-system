# GitHub Release Workflow

## Summary

Create a GitHub Actions workflow that automates plugin releases on git tag push. The workflow packages the plugin, creates a GitHub Release with changelog, and submits a PR to update the NotMyself/claude-dotnet-marketplace with the new version.

## Requirements

- [ ] Version synchronization - Keep version in sync across `package.json` and `.claude-plugin/plugin.json`
- [ ] Git tag trigger - Release workflow triggers on `v*` tag push (e.g., v1.2.0)
- [ ] Validation gate - Block release if tag version doesn't match package files
- [ ] Changelog generation - Auto-generate from conventional commits
- [ ] GitHub Release - Create release with changelog body and optional archive
- [ ] Marketplace PR - Submit PR to NotMyself/claude-dotnet-marketplace updating version

## Implementation Approach

### Workflow Architecture

```
Tag Push (v1.2.0)
       |
       v
+------------------+
| Release Workflow |
+------------------+
       |
       +---> Validate tag matches version files
       +---> Run tests and build
       +---> Generate changelog
       +---> Create GitHub Release
       +---> Create PR to marketplace repo
```

### Key Components

1. **Version Validation Script** - TypeScript script to ensure tag matches all version files
2. **Release Workflow** - Main GitHub Actions workflow triggered by tags
3. **Changelog Generation** - Using `requarks/changelog-action` from conventional commits
4. **Marketplace Update** - Direct PR creation using `peter-evans/create-pull-request`

### Authentication

Cross-repo PR requires a Fine-Grained PAT (`MARKETPLACE_PAT`) with:
- `contents: write` on `NotMyself/claude-dotnet-marketplace`
- `pull_requests: write` on `NotMyself/claude-dotnet-marketplace`

## Files to Modify

| File | Changes |
|------|---------|
| `.github/workflows/release.yml` | New: Main release workflow |
| `scripts/validate-version.ts` | New: Validate tag matches package versions |
| `scripts/bump-version.ts` | New: Sync version across all package files |
| `CHANGELOG.md` | New: Initial changelog (auto-maintained after) |

## Edge Cases

| ID | Case | Handling |
|----|------|----------|
| EC01 | Tag doesn't match version files | Validation fails, release blocked with instructions |
| EC02 | Tests fail during release | Release blocked before GitHub Release created |
| EC03 | Marketplace PR fails | Release succeeds, PR creation logged as warning |
| EC04 | Prerelease tag (v1.2.0-beta.1) | Marked as prerelease in GitHub Release |

## Testing Strategy

- Manual test: Bump version, push v1.0.1 tag, verify:
  - Validation passes
  - GitHub Release created with changelog
  - Marketplace PR submitted
- Verify prerelease detection with `-beta` suffix tag

Verification command: `bun run scripts/validate-version.ts <version>`

## Decisions

| ID | Decision | Rationale |
|----|----------|-----------|
| D01 | Use `requarks/changelog-action` for changelog | Auto-generates from conventional commits, maintains CHANGELOG.md |
| D02 | Direct PR to marketplace (not repository_dispatch) | Simpler setup, no workflow needed in marketplace repo |
| D03 | Store PAT in GitHub Secrets | Standard secure approach for cross-repo access |
| D04 | No release archive by default | Claude Code installs from git repo directly, archive optional |
| D05 | Semver versioning | Standard, well-understood, supports prereleases |

## Open Questions

*None - all questions resolved.*
