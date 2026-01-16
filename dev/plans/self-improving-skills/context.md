# Context

## Project Background

The planning-system is a plugin for Claude Code that provides mechanical enforcement of quality gates during feature development. It uses Beads for state management and hooks to block premature completion.

## Architecture Vision

This feature adds a "reflect" mechanism that enables Claude Code to learn from user corrections and successful patterns across sessions. The key insight is "correct once, never again" - explicit corrections in conversations should become persistent preferences stored in project skill files.

## Key Components

### Existing Infrastructure
- **Verification Scripts** (`verification/`): TypeScript scripts run by hooks
- **Hooks** (`hooks/hooks.json`): Intercept Stop events for quality gates
- **Skill Files** (`.claude/`): Project-specific instructions loaded by Claude Code
- **Anthropic SDK**: Already used by `verification-agent.ts` for AI-powered verification

### New Components
- **Reflect Agent**: Analyzes conversations for corrections and patterns
- **Reflect Config**: Manages toggle state for automatic reflection
- **Reflect Utils**: Skill file operations and git commit helpers
- **Reflect Hook**: Optional Stop hook for automatic reflection on session end
- **Reflect Command**: `/reflect` slash command for manual analysis

## Data Flow

```
Conversation → Reflect Agent (analysis) → Learnings (with confidence)
                                              ↓
                            User Approval → Skill File Update → Git Commit
```

## Integration Points

1. **Hooks System**: reflect-hook.ts added to Stop hooks (toggleable)
2. **Anthropic API**: reflect-agent.ts follows verification-agent.ts pattern
3. **Skill Files**: Updates `.claude/` markdown files with learned preferences
4. **Git**: Commits changes with descriptive messages

## Design Principles

1. **Non-blocking**: Missing API key or errors should not block workflow
2. **User Control**: All changes require explicit approval
3. **Confidence-based**: High confidence learnings distinguished from observations
4. **Evidence-linked**: Each learning includes source evidence from conversation
