# Testing Strategy

## Manual Testing

Since this feature involves AI-powered conversation analysis and user interaction, primary testing is manual:

### Test 1: Manual Mode Basic Flow

1. Have a conversation with explicit corrections ("Never use var", "Always use async/await")
2. Run `/reflect`
3. Verify proposed learnings show correct confidence levels
4. Verify evidence quotes are accurate
5. Approve changes
6. Check skill file was updated correctly
7. Check git commit was created with proper message

### Test 2: Toggle Commands

1. Run `reflect status` - should show disabled
2. Run `reflect on` - should enable
3. Run `reflect status` - should show enabled
4. Check `.reflect-state.json` was created with `enabled: true`
5. Run `reflect off` - should disable
6. Check state file updated

### Test 3: Automatic Mode

1. Enable automatic mode with `reflect on`
2. Have conversation with corrections
3. End session (trigger Stop hook)
4. Verify reflection runs after verification
5. Verify only high-confidence learnings are auto-applied (with approval prompt)

### Test 4: Skill File Formatting

1. Run reflect with learnings
2. Approve changes
3. Open skill file and verify:
   - "Learned Preferences" section exists
   - Learnings grouped by confidence
   - Dates are accurate
   - Evidence is quoted

### Test 5: Git Integration

1. Run reflect and approve changes
2. Run `git log -1` - verify commit message references "reflect"
3. Run `git diff HEAD~1` - verify only skill file changed

## Edge Case Tests

### Test EC01: No API Key

1. Unset `ANTHROPIC_API_KEY`
2. Run `/reflect`
3. Verify graceful message about skipping (no crash)

### Test EC02: No Skill Files

1. Rename `.claude/` directory
2. Run `/reflect` with learnings
3. Verify `.claude/learnings.md` is created

### Test EC03: No Git

1. Navigate to non-git directory
2. Run `/reflect` with learnings
3. Verify changes applied locally
4. Verify message about skipping commit

### Test EC04: Large Conversation

1. Generate very long conversation (e.g., 100+ messages)
2. Run `/reflect`
3. Verify truncation warning appears
4. Verify analysis still works on recent messages

### Test EC07: Corrupted State

1. Write invalid JSON to `.reflect-state.json`
2. Run `reflect status`
3. Verify defaults to disabled, doesn't crash

### Test EC10: User Cancels

1. Run `/reflect` with learnings
2. Choose "n" at approval prompt
3. Verify no files changed
4. Verify can re-run reflect successfully

## Verification Commands

Each feature has a verification command that should pass before marking complete:

- **Config module**: `bun run verification/lib/reflect-config.ts` (exports should load)
- **Utils module**: `bun run verification/lib/reflect-utils.ts` (exports should load)
- **Agent module**: `bun run verification/lib/reflect-agent.ts` (exports should load)
- **Main script**: `bun run verification/reflect.ts --help` (should show usage)
- **Hook script**: `bun run verification/reflect-hook.ts` (should exit 0 when disabled)

## Integration Tests

After all features complete:

1. Full end-to-end flow: conversation → reflect → approval → commit → verify persisted
2. Verify hooks.json loads without errors
3. Verify SKILL.md documents reflect commands accurately
4. Verify reflect-patterns.md matches actual implementation
