# Edge Cases

| ID | Case | Handling | Related Features |
|----|------|----------|------------------|
| EC01 | Tag doesn't match version files | Validation fails, release blocked with instructions | F001, F003 |
| EC02 | Tests fail during release | Release blocked before GitHub Release created | F003 |
| EC03 | Marketplace PR fails | Release succeeds, PR creation logged as warning | F003 |
| EC04 | Prerelease tag (v1.2.0-beta.1) | Marked as prerelease in GitHub Release | F002, F003 |
