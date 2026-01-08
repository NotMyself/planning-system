# Planning System

A Claude Code plugin for planning and executing complex features with reliable sub-agents.

## What It Does

Break large features into smaller pieces, then let Claude execute them one by one - with built-in verification that ensures each piece is actually complete before moving on.

No more sub-agents claiming "done" when tests don't pass or code isn't committed.

## Install

**Prerequisites:** [Bun](https://bun.sh), [Beads](https://github.com/bpowers/beads), Git, GitHub CLI

**Optional:**
- [Perles](https://github.com/bpowers/perles) - Visual tracking UI for Beads
- [Azure CLI](https://docs.microsoft.com/cli/azure/) (`az`) - For Azure DevOps integration (PRs, work item sync)

```bash
claude plugin marketplace add NotMyself/claude-dotnet-marketplace
claude plugin install planning-system
```

## Commands

### `/plan-new`

Start planning a new feature. Claude will ask questions, help you think through edge cases, and create a structured plan.

```
/plan-new
```

### `/plan-optimize`

Break your plan into executable chunks. Creates a sequence of feature prompts that sub-agents can implement.

```
/plan-optimize dev/plans/my-feature/plan.md
```

### `/plan-orchestrate`

Execute your plan. Spawns sub-agents for each feature, verifies their work, and creates a PR when done.

```
/plan-orchestrate dev/plans/my-feature/
```

### `/plan-parallel`

Run multiple plans simultaneously using git worktrees.

```
/plan-parallel dev/plans/feature-a dev/plans/feature-b
```

## Typical Session

```
> /plan-new

Claude: What feature are you building?

You: I want to add user authentication with OAuth

Claude: [asks clarifying questions, creates plan]

> /plan-optimize dev/plans/auth/plan.md

Claude: [breaks plan into 5 features, creates prompts]

> /plan-orchestrate dev/plans/auth/

Claude: [executes each feature, verifies work, creates PR]

PR created: https://github.com/you/repo/pull/42
```

## If Something Goes Wrong

Just re-run the command. The system tracks progress and picks up where it left off.

```
/plan-orchestrate dev/plans/my-feature/
```

## License

MIT
