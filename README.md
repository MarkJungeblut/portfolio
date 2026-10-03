# claude-setup

A stack-agnostic template repo for projects built with [Claude Code](https://claude.com/claude-code).

It ships the things that are tedious to reinvent per project: a devcontainer
with Claude Code and `gh` preinstalled, written-down collaboration and git
guidelines that Claude actually loads, a plan → implement → review → archive
workflow as slash commands, and the GitHub scaffolding (PR template, CI
skeleton, Dependabot) to hang it on.

Nothing here assumes a language or framework. Pick one per project.

## What's in it

| Path | What it is |
|------|-----------|
| [`CLAUDE.md`](CLAUDE.md) | Project context Claude loads every session. Imports the guidelines below. **Fill this in first.** |
| [`docs/guidelines/ai-collaboration.md`](docs/guidelines/ai-collaboration.md) | Plan mode, Definition of Done, test requirements, scope rules. |
| [`docs/guidelines/git-workflow.md`](docs/guidelines/git-workflow.md) | Branch naming, Conventional Commits, PR process. |
| [`docs/plans/`](docs/plans/) | Archived implementation plans, numbered. `_template.md` is the archive format. |
| [`.claude/skills/plan/`](.claude/skills/plan/) | `/plan` — the full workflow: branch, plan, implement, verify, archive. |
| [`.claude/skills/review-implementation/`](.claude/skills/review-implementation/) | `/review-implementation` — independent review of the diff against the plan. |
| [`.claude/settings.json`](.claude/settings.json) | Baseline permission allowlist so routine read-only commands don't prompt. |
| [`.devcontainer/`](.devcontainer/) | Ubuntu base + Node, `gh`, and the Claude Code feature. Version-pinned via the lock file. |
| [`.github/`](.github/) | PR template, CI skeleton, Dependabot config. |

## Using it

Click **Use this template** on GitHub, then work through this checklist:

- [ ] **`CLAUDE.md`** — fill in the project name, stack, layout, and the
      commands table. The Definition of Done depends on those commands being
      discoverable.
- [ ] **`.devcontainer/devcontainer.json`** — add the language feature your
      project needs (`python`, `go`, `java`, …). Drop the `node` feature if
      your base image or language feature already provides Node, and delete
      the `mounts` block if you'd rather keep auth container-local.
- [ ] **`.github/workflows/ci.yml`** — replace the placeholder steps with the
      real build/test/typecheck/lint/format commands. Until you do, CI passes
      with a warning annotation rather than giving you false confidence.
- [ ] **`.claude/settings.json`** — add your project's test and lint commands
      to the allowlist. Run `/fewer-permission-prompts` after a few sessions
      to catch the rest.
- [ ] **`docs/guidelines/`** — these are opinions, not law. Adjust them to
      match how you actually want to work; Claude will follow whatever's
      written there.
- [ ] **Branch protection** — the PR process in the git guidelines (no direct
      pushes to `main`, one approval, squash merge) is a GitHub repo setting.
      No file here enforces it. Configure it under Settings → Rules.
- [ ] **`LICENSE`** — MIT by default. Change or delete it.
- [ ] Replace this README with one about your actual project.

## The workflow

```
/plan  →  branch, plan mode, implement, verify Definition of Done
              ↓
/review-implementation  →  independent review of the diff against the plan
              ↓
/code-review            →  built-in correctness pass (complementary)
              ↓
back to /plan Step 6-7  →  archive the plan to docs/plans/NNNN-<slug>.md,
                           then push and open the PR
```

`/review-implementation` reads `docs/plans/current-plan.md`, which `/plan`
writes before implementation and deletes after archiving. That file is
gitignored — it's transient session state, and the archived copy in
`docs/plans/` is the durable record.

The review runs in a **fresh** context with no access to the planning
conversation, and with Edit/Write/Bash withheld. Both are deliberate: a
reviewer that sat through the implementation can't spot the reasoning it
already agreed with, and one that can edit tends to fix instead of report.
It reviews the whole branch (`git merge-base HEAD main`), not just uncommitted
work, so committing as you go doesn't hide anything from it.
