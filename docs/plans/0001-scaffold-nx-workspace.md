---
created: 2026-10-17
updated: 2026-10-17
---

# Plan: scaffold the Nx workspace

Branch: `chore/scaffold-nx-workspace`

## Context

The repo still holds only the template files (guidelines, CI skeleton,
devcontainer) and the design mockup. CLAUDE.md has settled the stack and the
workspace shape, but none of it exists yet, and the commands table that the
Definition of Done depends on is all `TODO`. This increment creates the
workspace, the empty app shell, and all nine library shells with module
boundaries enforced. It also wires the tooling and CI so every later increment
starts with a working DoD gate. No design or UI work is included.

Decisions already made with Mark:
- **TypeScript 6.0, not 7.** Angular 22.2.3 (`@angular/compiler-cli`,
  `@angular/build`) and typescript-eslint 8.71 all require `>=6.0 <6.1`.
  Pin `typescript@~6.0`. CLAUDE.md is corrected in the **first commit** of this
  branch, before any scaffolding, so the documented stack never disagrees with
  the code (see step 0).

## 0. Correct CLAUDE.md first (own commit: `docs: pin typescript 6.0 in stack`)

- Stack row: `TypeScript 7` → `TypeScript 6.0 — Angular 22 and
  typescript-eslint require \`>=6.0 <6.1\`; move to 7 when both support it`.
- The intro line "pinned to the latest at time of writing (2026-10-03)" →
  "pinned to the latest *supported* versions (2026-10-17)". TS 7 is the latest
  release, but not a compatible one.

Everything else in CLAUDE.md (Status, commands table, conventions) changes at
the end of the branch, once those things actually exist (step 7).
- **Scope:** workspace + app + e2e + all lib shells + tooling + CI.

## Versions (resolved from npm, 2026-10-17)

nx / @nx/* 23.3.0 · @angular/* 22.2.3 · typescript ~6.0 · vitest 5.0.5 ·
@playwright/test 1.64.1 · angular-eslint 22.6.0 · typescript-eslint 8.71.2 ·
prettier 3.9.10 · Node 24 (local is 24.11.1).

## Approach

### 1. Workspace bootstrap
*Revised during implementation (approved by Mark).* The original approach was
to generate with `create-nx-workspace --preset=apps` in the scratchpad and copy
its config in. That failed: in Nx 23.3 `--preset=apps` produces the "TS
solution" layout (npm workspaces, project references), and `@nx/angular`'s
application and library generators refuse it via
`assertNotUsingTsSolutionSetup`. The only Angular template
(`nrwl/angular-template`, which is also what `--preset=angular-monorepo` maps
to) is a fullstack shop demo with Express, Docker, `@org/*` libs, Analog
Vitest and Angular 22.1. It would mean more stripping than scaffolding.

Instead, hand-write a minimal integrated root:
- `package.json`: private, no workspaces; devDeps `nx`, `@nx/angular`,
  `@nx/eslint`, `@nx/eslint-plugin`, `@nx/playwright`, `@nx/js` (all 23.3.0),
  `typescript@~6.0`, `prettier`.
- `nx.json`: `namedInputs`, `defaultBase: main`, and generator defaults
  (scss, eslint, vitest-angular, playwright).
- `tsconfig.base.json`: paths-based (`moduleResolution: bundler`, empty
  `paths` that the generators fill).
- `.editorconfig`, `.prettierrc`, `.prettierignore` taken from the Nx Angular
  template (generic). Merge `.gitignore` entries (`node_modules`, `dist`,
  `tmp`, `out-tsc`, `.nx/cache`, `.nx/workspace-data`, `coverage`,
  `test-results`, `playwright-report`) into ours, keeping our existing
  sections.
- The Angular, ESLint, Vitest and Playwright deps get installed by the
  generators in step 2. Then align `@angular/*` to 22.2.3 if the generator
  pins older, and check `npm ci` resolves cleanly.

*Rejected:* `nrwl/angular-template` with the demo stripped out. It works, but
leaves leftover config and wrong versions for review to catch.

### 2. App shell: `apps/digital-portfolio`
```
nx g @nx/angular:application apps/digital-portfolio --style=scss
  --bundler=esbuild --ssr --unitTestRunner=vitest-angular
  --e2eTestRunner=none --linter=eslint --prefix=mj
  --tags=type:app --no-interactive
```
- `@angular/build:application` with Vite dev server/esbuild. No custom
  builder.
- **SSG:** set `outputMode: "static"` on the build target, and in
  `app.routes.server.ts` set `RenderMode.Prerender` for `''`. The output is
  plain HTML with no Node server bundle to deploy. `/impressum` gets added
  with its feature lib in a later increment, not now.
- Strip the Nx welcome component. The root component becomes a minimal
  `<main>` with a placeholder `<h1>` (for the e2e assertion) and a
  `<router-outlet>`.
- Component prefix `mj` (Mark Jungeblut), set once in the app and in every
  lib's ESLint selector rule. *Alternative:* the generator default `app`,
  which is generic and collides in spirit with Angular's own examples.

### 3. Library shells
For each lib in the CLAUDE.md layout:
```
nx g @nx/angular:library libs/<path> --name=<name> --tags=type:<t>
  --importPath=@portfolio/<path> --style=scss
  --unitTestRunner=vitest-angular --linter=eslint --prefix=mj
  --no-interactive
```
| Path | Name | Tag | Import |
|------|------|-----|--------|
| libs/features/home | features-home | type:feature | @portfolio/features/home |
| libs/features/profile | features-profile | type:feature | @portfolio/features/profile |
| libs/features/skills | features-skills | type:feature | @portfolio/features/skills |
| libs/features/portfolio | features-portfolio | type:feature | @portfolio/features/portfolio |
| libs/features/contact | features-contact | type:feature | @portfolio/features/contact |
| libs/features/impressum | features-impressum | type:feature | @portfolio/features/impressum |
| libs/data | data | type:data | @portfolio/data |
| libs/ui | ui | type:ui | @portfolio/ui |
| libs/utils | utils | type:util | @portfolio/utils |

- Non-buildable libs. The app compiles them from source, which is all a single
  app needs.
- Delete each lib's generated placeholder component and spec. `index.ts`
  exports nothing yet (`export {};`).
- `libs/utils` is framework-agnostic, so generate it with
  `@nx/js:library --bundler=none --unitTestRunner=vitest` rather than the
  Angular generator. That keeps Angular out of its deps.
- **Empty test targets:** Vitest fails with "no test files". Add a root
  `vitest.shared.ts` with `test.passWithNoTests: true` and point each
  project's `test` target at it via `runnerConfig`. *Fallback, if
  `runnerConfig` doesn't merge as expected:* keep one generated spec per lib
  until real code lands, and note it here.

### 4. Module boundaries
In the root `eslint.config.mjs`, configure `@nx/enforce-module-boundaries`
with `enforceBuildableLibDependency: true` and these constraints:
```
type:app     -> type:feature, type:ui, type:data, type:util
type:feature -> type:ui, type:util, type:data
type:data    -> type:util
type:ui      -> type:util
type:util    -> type:util
```
Features can't import each other: `type:feature` isn't in its own allow-list.

### 5. Typecheck target
The Angular build already type-checks the app and every lib it reaches,
templates included. A separate gate is still needed for spec files and for
libs the app doesn't import yet. Add a `typecheck` target via `targetDefaults`
in `nx.json`:
`tsc --noEmit -p {projectRoot}/tsconfig.{lib|app}.json` plus
`tsconfig.spec.json`. *Alternative:* `ngc --noEmit`, which also checks
templates. Rejected for now because the build already covers templates and
`ngc` per lib is slower. Revisit if template errors slip through.

### 6. CI (`.github/workflows/ci.yml`)
Replace the placeholder steps:
- `actions/setup-node@v4` (node 24, npm cache) → `npm ci`
- `nrwl/nx-set-shas@v4` so `affected` has a base
- `npx nx affected -t build typecheck test lint`
- `npx nx format:check`

### 7. Template housekeeping (template checklist items for this repo)
- `.github/dependabot.yml`: add an `npm` ecosystem block, monthly, grouped
  for `@angular/*` and `@nx/*`+`nx` so their lockstep versions move together.
- `.devcontainer/devcontainer.json`: pin the node feature to `"version": "24"`.
- `.claude/settings.json`: allow `Bash(npx nx:*)`.
- **CLAUDE.md** (the TS correction already landed in step 0): Status →
  scaffolded, dropping "Not yet scaffolded" and "the first implementation task
  is creating the Nx workspace". Fill the commands table (below). Record the
  `@portfolio/*` import alias, the `mj` prefix, and the static-output SSG
  setup (`outputMode: "static"`), because they're load-bearing.

### 8. Replace README.md
The current README describes the template ("claude-setup", "stack-agnostic").
Once the workspace exists that is false, and the template's own checklist
names replacing it as a setup step. Write a short README for a human visitor:
- One paragraph on what the site is (Mark's portfolio: split-screen, two
  prerendered pages).
- Prerequisites: Node 24, npm, or the devcontainer.
- Getting started: `npm ci` and `npx nx serve digital-portfolio`.
- The commands table. It duplicates CLAUDE.md, which is acceptable because the
  README is the human entry point and CLAUDE.md is Claude's.
- A brief workspace map (apps/libs and the boundary tags), linking to
  CLAUDE.md for the rules rather than restating them.
- Workflow: one line pointing to `docs/guidelines/` and the
  `/plan` → `/review-implementation` flow.
- License line (MIT, unchanged).

Kept deliberately short: CLAUDE.md and `docs/guidelines/` stay the source of
truth, and the README links to them instead of copying them.
*Alternative:* a separate `docs/readme` PR. Rejected because merging this
branch alone would leave `main` with a README that contradicts the code.

Commands table to record:
| Task | Command |
|------|---------|
| Install | `npm ci` |
| Dev server | `npx nx serve digital-portfolio` |
| Build | `npx nx run-many -t build` |
| Test | `npx nx run-many -t test` |
| Single test | `npx nx test <project> --filter=<pattern>` |
| Typecheck | `npx nx run-many -t typecheck` |
| Lint | `npx nx run-many -t lint` |
| Format | `npx nx format:write` (check: `npx nx format:check`) |

## Tests

There's no product logic in this increment, so the guidelines don't require any unit
tests. E2E is out of scope (see below). The prerender behaviour is verified
by checking the build output (criteria 2 and 5).

## Changes agreed during implementation

- **Library tests (Mark chose "official runner, borrowed").** `@nx/angular`
  only allows `vitest-angular` on buildable libs. Libraries are generated
  with `--unitTestRunner=none`. A `targetDefaults` entry for
  `@angular/build:unit-test` points at `digital-portfolio:build:development`
  with `{projectRoot}/tsconfig.spec.json`. The builder fails with "No tests
  found" before Vitest starts, so `passWithNoTests`/`vitest.shared.ts` can't
  work. *Superseded:* this first gave projects a `test` target only once
  someone added it by hand with the first spec. Generated specs then silently
  never ran, so Mark chose to infer the target instead. A local Nx plugin,
  `tools/nx-plugins/spec-test-target` (tag `type:tool`), adds
  `@angular/build:unit-test` to any app/lib containing `src/**/*.spec.ts`,
  with `buildTarget` set via the plugin options in `nx.json`. Every app/lib
  has a `tsconfig.spec.json`. The plugin has its own Vitest tests: spec
  present, spec absent, spec outside `src`. It was also verified end to end:
  a generated component's spec ran under `nx test ui` with no other edits.
  The CI-guard alternative was rejected because it still needs hand-wiring.
  `utils` uses the same runner, so `@nx/vitest` was not added.
- **Node:** `.nvmrc` pins 24. Angular 22 requires `^24.15`, and Mark's local
  24.11.1 was upgraded to 24.22.0 via nvm.
- **Prettier ignores `*.md`.** It padded CLAUDE.md's tables and rewrote
  emphasis, and Markdown is hand-formatted prose.
- **Typecheck** covers `tsconfig.{app|lib}.json` only. Specs are type-checked
  by the test run, verified by a deliberate TS2322 in a spec failing `nx test`.
- **Server routes** keep the generated `'**'` → `RenderMode.Prerender`
  rather than `''`, so `/impressum` is prerendered without a further edit.
- **Versions:** the app generator pinned Angular 22.1 and added
  `@angular-devkit/build-angular` (Webpack) and Express. These were aligned to
  22.2.3, and the unused packages removed. ESLint 9 → 10, since every plugin
  supports it.

## Fixes from /code-review (Mark approved 1–8)

1. `libs/utils/tsconfig.lib.json` excludes specs, as the Angular libs do.
2. The plugin also detects `*.test.ts`, matching the builder's default
   `include`. Every `tsconfig.spec.json` includes it too.
3. CI grants `actions: read` for `nrwl/nx-set-shas`.
4. The inferred `test` target hashes the borrowed build project's
   `production` input, so app config changes invalidate cached lib tests.
5. Tests added for the `.test.ts` case and the missing-`buildTarget` error.
6. `.claude/settings.json`: `npx nx:*` narrowed to running targets and
   read-only commands. `nx g`, `nx migrate` and `nx exec` still prompt.
7. CI reads Node from `.nvmrc`, and `package.json` has `engines.node: ^24.15.0`.
8. Dependabot ignores TypeScript `>=6.1` and groups `angular-eslint` with
   Angular. CLAUDE.md notes that Nx upgrades go through `nx migrate`.

## Fixes from /review-implementation (Mark approved A, B, C, F, I)

- A: criterion 3 reworded for 11 projects and inferred test targets.
- B: CI runs `nx run-many -t test` rather than `affected`. Lib tests borrow
  the app's build, but libs don't depend on the app in the graph, so
  `affected` would skip them after app changes. The suggested fix, an
  implicit lib → app dependency, was rejected: the app imports the libs, so
  it would create a cycle.
- C: `--filter` is documented as apps/libs only. The tooling project takes
  `-- -t <pattern>`.
- F: the README workspace map shows boundary tags and `tools/`.
- I: the first plugin test asserts behaviour (executor, borrowed build,
  tsconfig, app input) instead of a literal copy of the target.

Not fixed: `globSync` per project (premature optimisation) and Nx's
generated lint `inputs` (left as Nx's own default).

## Acceptance criteria

1. `npm ci` succeeds from a clean clone. No peer-dependency errors, no
   `--legacy-peer-deps`.
2. `nx run-many -t build` produces `dist/apps/digital-portfolio/browser/index.html`
   with the placeholder content, and no `server/` output.
3. `nx run-many -t typecheck test lint` all pass, across all 11 projects (the
   10 apps/libs plus `tools/nx-plugins/spec-test-target`). Until an app or lib
   has specs, `test` runs only the plugin's own tests; projects without specs
   have no `test` target by design.
4. `nx format:check` passes.
5. *(Dropped: e2e is out of scope.)* Instead, the built `index.html`
   contains the `<h1>` text. This is checked by hand, as in criterion 2.
6. `nx graph` shows the 9 libs with correct tags. A deliberate
   `ui → data` import fails lint with a boundary error. This is checked
   manually and then reverted, not committed.
7. CI runs real gates. No `CI not configured` warnings remain.
8. CLAUDE.md: the TypeScript correction (step 0) is the branch's first commit,
   and the Status, commands table and conventions are updated at the end
   (step 7). Every command in the table has actually been run successfully.
9. README.md describes this project rather than the template. Its getting-started
   steps work verbatim from a clean clone.

## Out of scope

- **E2E tests and the Playwright project** (Mark, during implementation:
  "skip e2e tests for now"). The generated e2e project was removed, along
  with `@nx/playwright`, `@playwright/test` and `eslint-plugin-playwright`.
  Re-add with `nx g @nx/playwright:configuration` when it's wanted.

- Any UI from the mockup: tokens, layout, typography, imagery, motion.
- `/impressum` route and any feature or section content.
- Image optimisation pipeline.
- Hosting/deployment.
- Branch protection, which is a GitHub setting, not a file.

## Verification

Run the commands table top to bottom locally. Open `dist/.../index.html`
directly to confirm static content. Run the boundary violation check from
criterion 6. Push only after Mark approves (Step 7 of /plan).

