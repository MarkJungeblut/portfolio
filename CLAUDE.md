# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Portfolio — Mark Jungeblut

Personal portfolio site. Single-page split-screen design: content column on the
left, full-bleed portrait on the right.

## Status

**Header and home section built.** The Nx workspace, the app shell and all
library shells exist with boundaries enforced. The site header (`libs/ui`) and
the home section (`libs/features/home`) are done; the mobile menu overlay,
scroll-spy and the remaining page sections are still to come. `/impressum` is
an empty placeholder route.

## Stack

Decided, pinned to the latest *supported* versions (2026-10-17):

| Layer | Choice |
|-------|--------|
| Monorepo | Nx 23 with enforced module boundaries |
| Framework | Angular 22 — standalone components, signals, new control flow (`@if` / `@for`) |
| Build | `@angular/build` application builder — **Vite** dev server + esbuild. Webpack is legacy here; do not reach for a custom builder or Analog to "get Vite" |
| Language | TypeScript 6.0 — Angular 22 and typescript-eslint require `>=6.0 <6.1`; move to 7 when both support it |
| Rendering | **Prerendered to static HTML (SSG)** at build time — two pages: `/` and `/impressum` |
| Styling | SCSS + CSS custom properties for design tokens (`apps/digital-portfolio/src/styles.scss`). No Tailwind |
| Fonts | Self-hosted via `@fontsource`, never Google Fonts (GDPR). Import only the weights in use |
| Content | Typed TS constants in a content lib, injected via a service. No runtime fetch |
| Unit tests | Vitest (Angular 22's official runner — Karma is gone) |
| E2E | Playwright — decided, not set up yet (add with `nx g @nx/playwright:configuration`) |
| Lint/format | ESLint (typescript-eslint + `@angular-eslint`) and Prettier |
| Package manager | npm |

## Layout

Workspace shape. Each library's directory mirrors its boundary type —
the folder name *is* the tag:

```
apps/
  digital-portfolio/    type:app — the shell: routing, layout, global styles
libs/
  features/
    home/               type:feature
    impressum/          type:feature
  data/                 type:data    — portfolio content + its types
  ui/                   type:ui      — presentational components, no state
  utils/                type:util    — framework-agnostic helpers
tools/
  nx-plugins/           type:tool    — workspace tooling, never imported by app code
```

The remaining section libs (`profile`, `skills`, `portfolio`, `contact`) are not
scaffolded up front — generate each one (`type:feature`, `libs/features/<name>`,
`@portfolio/features/<name>`) in the increment that builds it.

The app is `digital-portfolio`, not `portfolio`, so that the future
`libs/features/portfolio` — the "Selected work" section — keeps the name the
design gives it. Nx project names must be unique; don't rename either one back.

Module boundaries, enforced via `@nx/enforce-module-boundaries`:

```
app     -> feature, ui, data, utils
feature -> ui, utils, data
data    -> utils
ui      -> utils
utils   -> utils
```

Features never import each other — they are siblings stacked by the app shell on
one page, not a dependency graph. A feature lib is a **section**, not a route.

### Routing

Only two routes, both prerendered:

| Route | What it is |
|-------|------------|
| `/` | The whole scrolling page — `features/home`, `profile`, `skills`, `portfolio`, `contact` stacked in order. In-page movement is anchor links plus scroll-spy, not the router |
| `/impressum` | `features/impressum`, rendered as the overlay. Given a real URL because a German legal notice has to be directly linkable |

Don't reach for the router to switch sections; that is what the scroll position
is for.

## Commands

The Definition of Done depends on these. Node `^24.15` is required by Angular 22.

| Task | Command | npm script |
|------|---------|------------|
| Install | `npm ci` | |
| Dev server | `npx nx serve digital-portfolio` | `npm start` |
| Build | `npx nx run-many -t build` | `npm run build` |
| Test | `npx nx run-many -t test` | `npm test` |
| Single test | `npx nx test <project> --filter=<pattern>` | |
| Typecheck | `npx nx run-many -t typecheck` | `npm run typecheck` |
| Lint | `npx nx run-many -t lint` | `npm run lint` |
| Format | `npx nx format:write` (check: `npx nx format:check`) | `npm run format` (check: `npm run format:check`) |
| Whole Definition of Done | `npx nx run-many -t build typecheck lint test && npx nx format:check` | `npm run verify` |

`--filter` applies to apps and libs. The tooling project runs plain Vitest:
`npx nx test spec-test-target -- -t <pattern>`.

CI runs `nx affected -t build typecheck lint`, `nx run-many -t test` (lib tests
borrow the app's build, which `affected` can't see) and `nx format:check`.
Use `nx graph` to inspect the dependency graph when a boundary rule fires.

### Workspace conventions

- **Imports:** `@portfolio/<lib path>`, e.g. `@portfolio/features/impressum`,
  `@portfolio/ui`. Component/directive prefix is `mj`.
- **SSG:** the build uses `outputMode: "static"` and prerenders every route
  (`app.routes.server.ts`). The output in `dist/apps/digital-portfolio/browser`
  is plain HTML — there is no server bundle, and none should be added.
- **Breakpoint:** the one layout breakpoint is `$wide` in
  `libs/ui/src/styles/_breakpoints.scss`. It is on the app's Sass include path,
  so any app or lib stylesheet uses `@use 'breakpoints' as *;`. Never re-type
  `860px` in SCSS.
- **Libraries are non-buildable** and generated with `--unitTestRunner=none`.
  `@nx/angular` only allows Angular's official runner on buildable libs, so
  tests borrow the app's development build config instead.
- **`test` targets are inferred, never hand-written.** The local plugin
  `tools/nx-plugins/spec-test-target` gives an app or lib a `test` target
  (`@angular/build:unit-test`) exactly when it contains `src/**/*.spec.ts`
  or `*.test.ts` —
  the builder fails on zero specs, so the target can't exist everywhere. Just
  write the spec; it runs. Specs are type-checked by the test run;
  `typecheck` covers non-spec sources only.
- **Upgrading Nx or Angular:** use `npx nx migrate latest`, then
  `npx nx migrate --run-migrations`. Dependabot only bumps versions and can't
  run migrations, so treat its Nx PRs as a reminder, not the upgrade.
  TypeScript stays `<6.1` until Angular accepts newer.

## The design is the spec

`docs/mockup/design page - portfolio/` is the source of truth for the UI —
layout, colour, type, spacing, breakpoints, motion. **Read it before building
any component.** It changes; this file does not track its contents. Nothing
about the visual design is restated here, so never treat CLAUDE.md as a
substitute for opening the mockup.

Which file: the `.dc.html` ones are the readable source (markup plus the
component logic). If several exist, check `git log` for the one most recently
touched — the others go stale. Avoid `Mark Jungeblut - Portfolio.html`; it is an
11 MB export with every asset inlined. `screenshots/` shows it rendered.

It is a generated prototype, not code to port. Read it for intent, then
implement idiomatically in Angular.

### The brand outranks the mockup on colour, type and logo

`docs/design/` holds the brand guidelines (`MARK_Brand_Guidelines_v1.0.pdf`,
`Moodboard.md`) and the logo SVGs. For **colour, typeface and logo** they are
the authority; the mockup's palette and fonts are superseded. The mockup still
governs layout, spacing, breakpoints and motion. The MARK wordmark is always
the SVG asset (`svg/MARK_Logo.svg`), never re-set as text.

### Rules that outrank the mockup

The mockup is a prototype and cuts corners this project will not:

- **Mobile first, non-negotiable.** Base styles target the narrowest viewport;
  widen with `min-width` queries only. Never `max-width` queries walking a
  desktop layout backwards.
- **Breakpoints are CSS, never JavaScript.** The mockup branches on
  `window.innerWidth`. On a prerendered page that paints the wrong layout before
  hydration — use media queries so the static HTML is already correct.
- **`svh`, not `vh`**, for anything full-height on mobile.
- **44px minimum tap targets.**
- **Honour `prefers-reduced-motion`** — the mockup's animations are decorative
  and must be disablable.
- **Optimise the imagery.** The source photos are 8–12 MB; they need compression
  and responsive variants before they go anywhere near a page.

### Content caveat

The mockup mixes real content with placeholder — the career history is real, the
contact details are dummy text. Check before assuming.

**The Impressum is settled.** `docs/mockup/ImpressumPage.tsx` holds the real
details, carried over from another of Mark's projects. It is React and Tailwind
from a different design system — take the *data and the German wording*, ignore
the markup and classes entirely. It supersedes the dummy Impressum inside the
mockup (`Musterstraße 1`, `DE000000000`), which must not be used.

Note it declares the site private and non-commercial, which is why it carries no
USt-IdNr. and no phone number — don't reintroduce the mockup's placeholder ones.
A German Impressum is a legal requirement; treat changes to its wording as
Mark's call, not an implementation detail.

The Skills section lists React/Next.js as Mark's skills — that is *content about
Mark*, not a statement about this repository's stack.

## Guidelines

These govern every session in this repository. They are not optional reading.

@docs/guidelines/ai-collaboration.md
@docs/guidelines/git-workflow.md
