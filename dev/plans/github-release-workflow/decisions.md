# Decisions Log

| ID | Decision | Rationale |
|----|----------|-----------|
| D01 | Use `requarks/changelog-action` for changelog | Auto-generates from conventional commits, maintains CHANGELOG.md |
| D02 | Direct PR to marketplace (not repository_dispatch) | Simpler setup, no workflow needed in marketplace repo |
| D03 | Store PAT in GitHub Secrets | Standard secure approach for cross-repo access |
| D04 | No release archive by default | Claude Code installs from git repo directly, archive optional |
| D05 | Semver versioning | Standard, well-understood, supports prereleases |
