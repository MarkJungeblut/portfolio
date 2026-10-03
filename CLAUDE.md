# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Portfolio — Mark Jungeblut

Personal portfolio site. Single-page split-screen design: content column on the
left, full-bleed portrait on the right.

## Status

**Not yet scaffolded.** The repository currently holds only the template
scaffolding (guidelines, CI skeleton, devcontainer) and the design mockup. The
stack below is decided but unimplemented — the first implementation task is
creating the Nx workspace.

## Stack

Decided, pinned to the latest at time of writing (2026-10-03):

| Layer | Choice |
|-------|--------|
| Monorepo | Nx 23 with enforced module boundaries |
| Framework | Angular 22 — standalone components, signals, new control flow (`@if` / `@for`) |
| Build | `@angular/build` application builder — **Vite** dev server + esbuild. Webpack is legacy here; do not reach for a custom builder or Analog to "get Vite" |
| Language | TypeScript 7 |
| Rendering | **Prerendered to static HTML (SSG)** at build time — two pages: `/` and `/impressum` |
| Styling | SCSS + CSS custom properties for design tokens. No Tailwind |
| Content | Typed TS constants in a content lib, injected via a service. No runtime fetch |
| Unit tests | Vitest (Angular 22's official runner — Karma is gone) |
| E2E | Playwright |
| Lint/format | ESLint (typescript-eslint + `@angular-eslint`) and Prettier |
| Package manager | npm |

## Layout

Target workspace shape. Each library's directory mirrors its boundary type —
the folder name *is* the tag:

```
apps/
  digital-portfolio/    the shell: routing, layout, global styles
  digital-portfolio-e2e/
libs/
  features/
    home/               type:feature
    profile/            type:feature
    skills/             type:feature
    portfolio/          type:feature
    contact/            type:feature
    impressum/          type:feature
  data/                 type:data    — portfolio content + its types
  ui/                   type:ui      — presentational components, no state
  utils/                type:util    — framework-agnostic helpers
```

The app is `digital-portfolio`, not `portfolio`, so that `libs/features/portfolio`
— the "Selected work" section — keeps the name the design gives it. Nx project
names must be unique; don't rename either one back.

Module boundaries, enforced via `@nx/enforce-module-boundaries`:

```
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
|-------|-----------|
| `/` | The whole scrolling page — `features/home`, `profile`, `skills`, `portfolio`, `contact` stacked in order. In-page movement is anchor links plus scroll-spy, not the router |
| `/impressum` | `features/impressum`, rendered as the overlay. Given a real URL because a German legal notice has to be directly linkable |

Don't reach for the router to switch sections; that is what the scroll position
is for.

## Commands

Fill in once the workspace exists; the Definition of Done depends on these.

| Task          | Command |
|---------------|---------|
| Install       | `TODO`  |
| Dev server    | `TODO`  |
| Build         | `TODO`  |
| Test          | `TODO`  |
| Single test   | `TODO`  |
| E2E           | `TODO`  |
| Typecheck     | `TODO`  |
| Lint          | `TODO`  |
| Format        | `TODO`  |

Nx-specific notes to record here when scaffolding: prefer `nx affected -t <target>`
in CI over running every project, and `nx graph` to inspect the dependency graph
when a boundary rule fires.

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
