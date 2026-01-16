# Edge Cases

## EC01: Missing API Key

**Case**: `ANTHROPIC_API_KEY` environment variable not set.

**Handling**: Skip reflection gracefully, return message indicating reflection was skipped. Do not block workflow or throw errors.

## EC02: No Project Skill Files

**Case**: Project has no `.claude/` directory or skill files.

**Handling**: Create `.claude/learnings.md` as fallback location for learned preferences. Create directory if it doesn't exist.

## EC03: Git Not Available

**Case**: Git command not in PATH or current directory is not a git repository.

**Handling**: Apply changes to skill file locally but skip commit. Inform user changes were applied but not committed.

## EC04: Large Conversations

**Case**: Conversation transcript exceeds Anthropic API token limits.

**Handling**: Truncate conversation to most recent N messages (keeping recent context where corrections are most likely). Log warning about truncation.

## EC05: Conflicting Learnings

**Case**: New learning contradicts an existing learned preference.

**Handling**: Present both learnings to user during approval, explain the conflict, let user choose which to keep or merge.

## EC06: Empty Conversation

**Case**: User runs `/reflect` with no meaningful conversation content.

**Handling**: Return message indicating no learnings could be extracted. Don't create empty updates.

## EC07: Toggle State File Corrupted

**Case**: `.reflect-state.json` contains invalid JSON or unexpected structure.

**Handling**: Reset to default state (disabled), log warning. Don't block on config errors.

## EC08: Skill File Write Fails

**Case**: Permission denied or disk full when writing to skill file.

**Handling**: Show error message with details, don't crash. Suggest user check permissions.

## EC09: Automatic Mode Without Learnings

**Case**: Stop hook runs with automatic mode enabled but no learnings detected.

**Handling**: Exit silently without prompting user. Only prompt when there are actual learnings to apply.

## EC10: User Cancels Approval

**Case**: User declines to apply proposed changes.

**Handling**: Exit cleanly, don't persist anything. Learnings can be re-extracted by running reflect again later.

## EC11: Multiple Skill Files

**Case**: Project has multiple skill files and user doesn't specify which one.

**Handling**: Auto-detect most relevant based on conversation context, or default to `learnings.md`. Show which file will be updated in approval flow.

## EC12: Concurrent Reflection

**Case**: Multiple reflect processes running simultaneously (e.g., multiple terminals).

**Handling**: Use file locking or last-write-wins semantics. State file conflicts are low risk due to gitignore.
