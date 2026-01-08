# Claude Code Planning System

A reliable planning and execution system for Claude Code that emphasizes mechanical enforcement over instruction compliance.

## Problem Solved

Claude Code sub-agents sometimes skip steps (tests, builds, commits) with responses like "I decided that was a lot of work." This system uses hooks and verification scripts to mechanically block shortcuts.

## Quick Start

1. Copy the `.claude/` directory to your project root
2. Install verification dependencies:
   ```bash
   cd .claude/skills/planning/verification
   bun install
   ```
3. Initialize Beads in your project (required)
4. Start planning: `/plan-new`

## Commands

| Command | Purpose |
|---------|---------|
| `/plan-new` | Enter planning mode, create plan document |
| `/plan-optimize <plan.md>` | Decompose plan into feature prompts |
| `/plan-orchestrate <plan-dir>` | Execute features with sub-agents |
| `/plan-parallel <dir1> <dir2>` | Execute multiple plans in parallel |

## Architecture

```
/plan-new ──► plan.md ──► /plan-optimize ──► manifest + prompts ──► /plan-orchestrate ──► PR
                              │                                              │
                              ▼                                              ▼
                         Beads Epic                                    Beads Tasks
```

## Key Features

- **Mechanical Enforcement**: Hooks block completion if quality gates not met
- **Sub-Agent Verification**: Claims are verified before acceptance
- **Crash Recovery**: Safe to re-run orchestration at any point
- **Dual-Repo Support**: GitHub and Azure DevOps PR creation
- **DevOps Sync**: Rich information to Azure DevOps boards
- **Beads Integration**: Epic/task state management

## Directory Structure

```
.claude/
├── commands/           # Slash commands (~50 lines each)
├── hooks.json          # Stop/SubagentStop hook config
└── skills/planning/
    ├── SKILL.md        # System overview
    ├── workflows/      # Detailed phase instructions
    ├── templates/      # File format templates
    ├── verification/   # TypeScript enforcement scripts
    └── reference/      # Quick reference guides
```

## Requirements

- Bun runtime
- Git
- Beads CLI (`bd`)
- GitHub CLI (`gh`) or Azure CLI (`az`) for PR creation

## Configuration Files

| File | Purpose |
|------|---------|
| `.beads` | Beads epic ID (created by /plan-new) |
| `.devops` | Azure DevOps Story config (optional) |
| `.planconfig` | PR creation overrides (optional) |

## How It Works

1. **Hooks** intercept Stop and SubagentStop events
2. **Verification scripts** check actual state (tests, commits, builds)
3. **Exit code 2** blocks completion and feeds stderr back to Claude
4. **State reconciliation** ensures idempotent orchestration

## License

MIT
