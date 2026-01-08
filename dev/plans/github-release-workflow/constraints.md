# Global Constraints

## Feature Execution

- One feature per session
- Run verification before claiming complete
- Commit after each feature
- Reference decision IDs in commits

## Code Quality

- Use Bun runtime for all scripts
- TypeScript for new code
- Preserve existing JSON formatting (2-space indent)

## Version Management

- All version files must stay in sync
- Semver format required (major.minor.patch)
- Prerelease suffixes supported (e.g., -beta.1, -rc.1)

## Workflow Safety

- Release blocked if validation fails
- Tests must pass before GitHub Release creation
- Marketplace PR failure is non-blocking (logged as warning)
