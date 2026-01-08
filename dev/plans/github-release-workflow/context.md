# Context

## Project Background

The planning-system is a Claude Code skill that provides planning and execution workflows for software development tasks. It uses mechanical enforcement (hooks and verification scripts) to ensure sub-agents complete all required steps.

## Architecture Vision

This plan adds a GitHub Actions release workflow that automates the plugin release process:

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
       +---> Generate changelog from commits
       +---> Create GitHub Release
       +---> Create PR to marketplace repo
```

## Key Integration Points

1. **Version Files**: `package.json` and `.claude-plugin/plugin.json` must stay in sync
2. **Marketplace**: NotMyself/claude-dotnet-marketplace hosts plugin registry
3. **Changelog**: Auto-generated from conventional commit messages
4. **GitHub Releases**: Primary distribution mechanism for the skill

## Authentication

Cross-repo operations require a Fine-Grained PAT (`MARKETPLACE_PAT`) stored in GitHub Secrets with:
- `contents:write` on `NotMyself/claude-dotnet-marketplace`
- `pull_requests:write` on `NotMyself/claude-dotnet-marketplace`
