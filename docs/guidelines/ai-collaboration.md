# AI Collaboration Guidelines

Rules for working with Claude Code in this repository. These apply to every session.

## Plan Mode

- Always use plan mode for any change touching more than one file or involving non-trivial logic.
- Exception: obvious single-line fixes (typos, constant renames).

## Proposing Alternatives

Always note what alternatives were considered and why the recommended approach was chosen. Dialogue is expected and encouraged — the goal is the best outcome, not the first idea.

## Definition of Done

A task is complete only when **all** of the following are true:

- The project **builds** successfully (for the layer(s) touched).
- **Typechecks pass**, where the language has a separate typecheck step from
  the build.
- **All tests pass** — new logic requires new tests.
- **Lint and format checks pass**, using whatever tooling this project defines
  for the layer(s) touched. Take the exact commands from the commands table
  in `CLAUDE.md`; if it's incomplete, fall back to the project's config files
  (`package.json` scripts, `Makefile`, `pyproject.toml`, CI config) and record
  what you find in that table. Never assume a fixed toolchain — every project
  this applies to may use a different one.

## Test Requirements

All new code requires tests, with one exception: purely presentational UI
components (props in, markup out — no conditionals, derived state, event
handlers with logic, validation, or data fetching) don't need tests. They
change shape often as designs evolve, and a test on pure markup breaks on
every restyle without ever catching a real regression.

Once a component has logic — a branch, a calculation, a state transition, an
error path — it needs a test, same as any other code.

Test behavior, not implementation. For UI code, query by accessible
roles/text rather than internal state, markup structure, or styling classes.
For non-UI code, test through the public interface (inputs and outputs, not
private internals).

Use the testing framework and conventions already established in this
project. If starting a layer from scratch with no existing convention, check
`docs/guidelines/` or the project's own config/dependency files for a
specified framework before picking one.

## Updating `CLAUDE.md`

Update it when a new domain concept is introduced, a key architectural decision is made, or the tech stack changes. Keep it minimal — facts only, no speculation. If it isn't load-bearing context for a future Claude session, leave it out.

## Scope

- Implement exactly what was asked — no gold-plating, no unrequested features.
- If something adjacent looks broken or suboptimal, flag it explicitly. Don't fix it silently.

## Incremental Changes

- Prefer small, focused changes over large sweeping ones.
- If a task feels large, break it into steps and confirm the direction after each before continuing.
- When in doubt, do less and ask — a short clarifying exchange is cheaper than a big revert.