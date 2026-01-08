# Global Constraints

Rules that apply to ALL features in this plan.

## Scope

- One feature per session - do not implement beyond current task scope
- Follow the prompt file exactly - no additions or shortcuts

## Quality

- Run verification command before claiming completion
- All tests must pass before committing
- Build must succeed before committing

## Process

- Commit after each feature with prescribed message format
- Reference decision IDs in commits when relevant
- Do not modify files outside the feature's scope

## Code Standards

<Project-specific standards from CLAUDE.md or similar>

## Testing

See `testing-strategy.md` for testing approach.

---

*These constraints are enforced by verification hooks. Violations will block completion.*
