# Feature: F004 - CHANGELOG & Documentation

## Context

See `context.md` for project background and architecture.

## Prior Work

Features completed before this one:
- **F001**: Version validation script
- **F002**: Version bump script
- **F003**: Release workflow — Workflow uses changelog action that maintains CHANGELOG.md

## Objective

Create an initial `CHANGELOG.md` file following Keep a Changelog format, and document the release process in the README or a dedicated RELEASING.md file.

> **Scope Constraint**: It is unacceptable to implement features beyond this task's scope. Complete ONLY this feature.

## Relevant Decisions

From `decisions.md`:
- **D01**: Use `requarks/changelog-action` for changelog — After initial creation, this action maintains it

## Edge Cases

No specific edge cases for this feature.

## Files to Create/Modify

| File | Purpose |
|------|---------|
| `CHANGELOG.md` | Create initial changelog file |
| `RELEASING.md` | Document the release process |

## Implementation Details

### CHANGELOG.md

Create following [Keep a Changelog](https://keepachangelog.com/) format:

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- GitHub Actions release workflow for automated releases
- Version validation and bump scripts

## [0.1.0] - YYYY-MM-DD

### Added
- Initial release of planning-system skill
- Planning, optimization, and orchestration workflows
- Beads integration for state management
- Verification system with hooks
```

### RELEASING.md

Document:
1. Prerequisites (MARKETPLACE_PAT secret)
2. How to prepare a release (bump version, commit)
3. How to trigger a release (push tag)
4. What happens during release (workflow steps)
5. Troubleshooting common issues

## Acceptance Criteria

- [ ] `CHANGELOG.md` exists with Keep a Changelog format
- [ ] `CHANGELOG.md` includes unreleased section for new workflow
- [ ] `RELEASING.md` documents the release process
- [ ] Documentation includes MARKETPLACE_PAT setup instructions

## Verification

```bash
test -f CHANGELOG.md
```

Run this command. Only claim completion if it succeeds (file exists).

## Commit

```bash
git add CHANGELOG.md RELEASING.md
git commit -m "docs(release): add changelog and release documentation

Implements: F004
Decisions: D01"
```

## Next

After verification passes, this feature is complete. All features are done - the orchestrator will create a PR.
