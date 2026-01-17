# Planning System

A Claude Code plugin for planning and executing complex features with reliable verification.

![Planning System in action with Perles visual tracking](assets/screenshot.png)

## What It Does

Break large features into smaller pieces, then execute them one by one - with built-in verification that ensures each piece is actually complete before moving on.

Uses Beads as the source of truth for plans and task state. Pull-based execution means you work on one task at a time, with quality gates enforced by hooks.

## Install

**Prerequisites:** [Bun](https://bun.sh), [Beads](https://github.com/steveyegge/beads), Git, GitHub CLI

**Optional:**
- [Perles](https://github.com/zjrosen/perles) - Visual tracking UI for Beads
- [Azure CLI](https://docs.microsoft.com/cli/azure/) with [DevOps extension](https://learn.microsoft.com/en-us/azure/devops/cli/) (`az extension add --name azure-devops`) - For Azure DevOps integration (PRs, work item sync)
- `ANTHROPIC_API_KEY` environment variable - For AI-powered test quality verification

```bash
claude plugin marketplace add NotMyself/claude-dotnet-marketplace
claude plugin install plan
```

## Commands

### `plan:new`

Start planning a new feature. Claude will ask questions, help you think through edge cases, and create a structured plan stored in a Beads epic.

```
plan:new
```

### `plan:optimize`

Break your plan into executable features. Creates Beads tasks with full prompts and supporting files.

```
plan:optimize <epic-id>
```

## Typical Session

### Standard Planning (single feature)

```
> plan:new

Claude: What feature are you building?

You: I want to add a health check endpoint

Claude: [asks clarifying questions, creates plan, stores in Beads epic]

Epic created: health-check-abc

> plan:optimize health-check-abc

Claude: [creates Beads tasks with prompts]

> bd ready
> bd update <task-id> --status=in_progress
[work, then close when done]
```

### Master Planning (large initiative)

For complex features with multiple sub-features:

```
> plan:new --master

Claude: What initiative are you building?

You: Real-time chat with rooms, users, and message history

Claude: [creates Epic with child Features - brief descriptions only]

Epic created: chat-app-xyz
Features: F001 Project Setup, F002 Auth, F003 Rooms, ...

> plan:new chat-app-xyz.f001

Claude: [detailed planning for F001, updates Feature description]

> plan:optimize chat-app-xyz.f001

Claude: [evaluates for research needs, then creates Tasks under F001]

> bd ready
> bd update <task-id> --status=in_progress
[work on tasks, close when done, then plan:new the next feature]
```

**Research evaluation:** When optimizing a feature, Claude scans for uncertainty markers (TBD, TODO, unclear, investigate, etc.). If found, it suggests creating research tasks first. Research tasks are immediately workable and bypass workflow checks.

**Workflow is enforced** - you cannot skip steps. Trying to implement a Feature directly will be blocked until you run `plan:optimize`.

## Project Configuration

Create `.planconfig` in your project root to configure verification commands:

```yaml
build_command: "npm run build"
test_command: "npm test"
lint_command: "eslint ."
format_command: "prettier --check ."
static_analysis_command: "sonar-scanner"
```

All commands are optional. If not configured, those verification steps are skipped.

## If Something Goes Wrong

Beads tracks all state. Use `bd ready` to see available work, `bd show <task-id>` to review any task.

## License

MIT
