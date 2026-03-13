---
description: "Git branch naming, commit messages, PR process, and code review standards"
---

# Git Workflow Rules

## Branch Naming

**Format:** `{type}/{description}`

**Types:**
- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates
- `test/` - Test additions/updates

**Examples:**
```
feature/invoice-generation
fix/staff-conflict-detection
refactor/kds-context-optimization
docs/update-developer-guide
```

## Commit Messages

**Format:** `{type}: {description}`

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code refactoring
- `docs:` - Documentation
- `test:` - Tests
- `chore:` - Build/tooling changes
- `style:` - Formatting (no code change)

**Examples:**
```
feat: add invoice generation functionality
fix: resolve staff conflict detection error
refactor: optimize KDS real-time subscriptions
docs: update database schema documentation
```

**Rules:**
- Use imperative mood ("add" not "added")
- Keep first line under 50 characters
- Add detailed description in body if needed
- Reference issues with `#issue-number`

## Pull Request Process

**Checklist before PR:**
1. ✅ Run quality checks: `pnpm check && pnpm lint && pnpm test`
2. ✅ Update documentation if needed
3. ✅ Follow all project rules
4. ✅ Create clear PR description
5. ✅ Request review from team member

**PR Description Template:**
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Feature
- [ ] Bug fix
- [ ] Refactor
- [ ] Documentation

## Testing
- [ ] Tests pass locally
- [ ] Manual testing completed
- [ ] Added new tests if needed

## Checklist
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] No linting errors
- [ ] No type errors
```

## Code Review

**Requirements:**
- At least one approval required before merge
- All comments addressed before merge
- CI checks must pass
- No force push to main branch
- Squash merge preferred
