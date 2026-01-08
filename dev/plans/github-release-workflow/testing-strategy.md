# Testing Strategy

## Manual Testing

After all features are implemented:

1. **Bump version**: `bun run scripts/bump-version.ts 0.1.1`
2. **Commit**: `git add . && git commit -m "chore: bump version to 0.1.1"`
3. **Tag and push**: `git tag v0.1.1 && git push origin v0.1.1`
4. **Verify**:
   - Validation passes (versions match)
   - GitHub Release created with changelog
   - Marketplace PR submitted

## Prerelease Testing

Test prerelease detection with `-beta` suffix:

1. `bun run scripts/bump-version.ts 0.2.0-beta.1`
2. `git tag v0.2.0-beta.1 && git push origin v0.2.0-beta.1`
3. Verify GitHub Release marked as prerelease

## Feature Verification Commands

| Feature | Verification Command |
|---------|---------------------|
| F001 | `bun run scripts/validate-version.ts 0.1.0` |
| F002 | `bun run scripts/bump-version.ts 0.1.1 --dry-run` |
| F003 | `bun run tsc --noEmit` |
| F004 | `test -f CHANGELOG.md` |
