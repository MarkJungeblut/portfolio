# Git Workflow

## Branch Naming

```
<type>/<short-description>
```

| Type     | When to use                              |
|----------|------------------------------------------|
| `feat/`  | New feature or user-facing capability    |
| `fix/`   | Bug fix                                  |
| `chore/` | Tooling, dependencies, CI, config        |
| `docs/`  | Documentation only                       |
| `refactor/` | Internal restructuring, no behaviour change |
| `test/`  | Adding or fixing tests only              |

Examples: `feat/task-list-api`, `fix/auth-token-expiry`, `chore/update-dependencies`

## Commit Style — Conventional Commits

```
<type>(<optional scope>): <short summary>

[optional body]

[optional footer(s)]
```

- Summary is imperative, lowercase, no trailing period, max 72 chars.
- Body explains *why*, not *what*.
- Footer references issues: `Closes #42`, `Refs #17`.

Examples:
```
feat(auth): add password reset via email link
fix(nav): correct active route highlight on bottom navigation
chore: upgrade build tooling to latest minor
```

## Pull Request Process

1. Branch from `main`; keep PRs small and focused.
2. Fill in the PR template (summary, type of change, test plan).
3. CI must pass before merge — every gate in the Definition of Done, for
   every layer the PR touches.
4. At least **1 approval** required before merging.
5. Merge strategy: **Squash and merge** to keep `main` history linear.
6. Delete the branch after merge.

## Protected Branches

- `main` is the only long-lived branch.
- Direct pushes to `main` are not allowed; all changes go through PRs.
