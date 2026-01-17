### plan

**Planning and execution system for Claude Code with mechanical enforcement**

Break large features into smaller pieces, then execute them one by one - with built-in verification that ensures each piece is actually complete before moving on. Uses Beads as the source of truth for plans and task state.

**Key Features:**
- **Collaborative Planning** - `plan:new` helps you think through features with Claude
- **Automatic Decomposition** - `plan:optimize` breaks plans into executable Beads tasks
- **Master Planning** - Plan large initiatives with multiple features
- **Research Evaluation** - Detects when research is needed before implementation
- **Workflow Enforcement** - Hooks ensure you can't skip planning steps
- **Quality Gates** - Verification scripts check tests, build, lint before completion

**Commands:**
- `plan:new` - Start planning a new feature (creates Beads epic)
- `plan:new --master` - Plan a large initiative with multiple features
- `plan:optimize <epic-id>` - Break plan into Beads tasks with prompts

**Workflow:**
```
plan:new ──► Beads Epic (plan in description)
                │
                ▼
plan:optimize ──► Beads Tasks (prompts in descriptions)
                │
                ▼
bd ready ──► Pull-based execution (one task at a time)
```

**Prerequisites:** [Bun](https://bun.sh), [Beads](https://github.com/steveyegge/beads), Git, GitHub CLI

**Optional:**
- [Perles](https://github.com/zjrosen/perles) - Visual tracking UI for Beads
- [Azure CLI](https://docs.microsoft.com/cli/azure/) with [DevOps extension](https://learn.microsoft.com/en-us/azure/devops/cli/) - For Azure DevOps integration
- `ANTHROPIC_API_KEY` environment variable - For AI-powered test quality verification

**Installation:**
```bash
/plugin install plan
```

**Version:** {{VERSION}}

**Repository:** [planning-system](https://github.com/NotMyself/planning-system)
