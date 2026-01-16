# Global Constraints

## Development Rules

1. **Complete one feature at a time** - Do not start a new feature until the current one is fully implemented and verified
2. **Run verification before claiming complete** - Each feature has a verification command that must pass
3. **Commit after each feature** - Reference feature IDs in commit messages
4. **Follow existing patterns** - Use `verification-agent.ts` as the template for AI-powered analysis

## Code Patterns

### TypeScript Style
- Use Bun's `$` shell helper for command execution
- Use Zod for schema validation (already in project dependencies)
- Export types and interfaces for cross-module use
- Handle errors gracefully - never throw blocking errors for optional features

### File Organization
- Main scripts in `verification/` root
- Shared utilities in `verification/lib/`
- Commands in `commands/` directory
- Reference docs in `skills/planning/reference/`

### Anthropic API Usage
- Check for `ANTHROPIC_API_KEY` before making calls
- Return graceful fallback when key is missing (don't block)
- Use `claude-sonnet-4-20250514` model (matching verification-agent.ts)
- Parse JSON responses with error handling

## Quality Standards

1. **No blocking on optional features** - Reflect is optional; failures should not stop workflow
2. **User approval required** - Never automatically modify skill files without consent
3. **Evidence preservation** - Every learning must include the source quote
4. **Confidence accuracy** - High confidence only for explicit corrections with imperative language

## Integration Rules

1. **Hooks must be optional** - reflect-hook.ts should check toggle state before running
2. **Git operations are optional** - Work locally if git unavailable
3. **Skill files are optional** - Create fallback `.claude/learnings.md` if no project skills exist
