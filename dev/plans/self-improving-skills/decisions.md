# Architectural Decisions

## D01: Follow verification-agent.ts Pattern

**Decision**: Use the same Anthropic SDK pattern as `verification-agent.ts` for AI-powered conversation analysis.

**Rationale**:
- Proven pattern already in codebase
- Consistent error handling approach (graceful degradation)
- Same model configuration and response parsing
- Developers familiar with the pattern

## D02: Three Confidence Levels

**Decision**: Categorize learnings into high/medium/low confidence.

**Rationale**:
- High confidence (explicit corrections): User said "never" or "always" - strong signal
- Medium confidence (success patterns): Approach worked and was approved - moderate signal
- Low confidence (observations): Implicit preferences observed - weak signal

**Implications**: Automatic mode only applies high-confidence learnings.

## D03: Toggle State in JSON File

**Decision**: Store toggle state in `.reflect-state.json` (gitignored).

**Rationale**:
- Simple JSON is easy to read/write
- Gitignored because toggle state is user-specific, not project-specific
- Includes metadata like last reflection timestamp and total learnings count

## D04: User Approval Flow Before Write

**Decision**: Always show proposed changes and require explicit approval before modifying skill files.

**Rationale**:
- Skill files are critical project configuration
- Wrong learnings could cause persistent bad behavior
- Users need to verify evidence and confidence assessments

## D05: Learned Preferences Section in Skill Files

**Decision**: Append learnings to a "Learned Preferences" section in skill markdown files, organized by confidence level.

**Rationale**:
- Clear separation from manual instructions
- Easy to review and prune
- Date-stamped for tracking when learned
- Evidence included for context

## D06: Git Integration Optional

**Decision**: Commit skill file changes with descriptive messages, but make git operations optional.

**Rationale**:
- Changes should be tracked in version control
- Some users may not have git in path or may be in non-git directories
- Local changes still valuable even without commit

## D07: Reflect Hook in Stop Hooks Array

**Decision**: Add `reflect-hook.ts` to the Stop hooks array after `verify-stop.ts`.

**Rationale**:
- Reflection runs after verification (quality gates first)
- Hook checks toggle state before running (disabled by default)
- Non-blocking - errors in reflect should not prevent stop
