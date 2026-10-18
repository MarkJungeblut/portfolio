---
created: 2026-10-18
updated: 2026-10-18
---

# Plan: site header

Branch: `feat/header`

## Context

The workspace is scaffolded but renders only a placeholder `<h1>`. This is the
first UI increment: the fixed site header. Two sources feed it:
- the **mockup** (`docs/mockup/design page - portfolio/Portfolio Hero.dc.html`,
  lines 27–40 plus `renderVals()`), for layout, sizing, spacing and the
  breakpoint;
- the **brand guidelines** (`docs/design/MARK_Brand_Guidelines_v1.0.pdf`,
  `Moodboard.md`, `svg/MARK_Logo.svg`), for colour, typeface and the logo. Where
  they disagree with the mockup, the brand wins: it states its colour codes
  replace earlier values. It also says the MARK wordmark must be used as the
  logo asset, never re-set as text.

Decisions already made with Mark:
- **Header bar only.** On mobile it shows the logo and the "Menu" button; the
  full-screen overlay is the next increment, so the button does nothing until
  then.
- **No scroll-spy in this increment.** Section links have no active state yet.
- **The Impressum link goes to `/impressum`**, with an empty placeholder route
  so it prerenders.
- **Typeface: Montserrat**, self-hosted, instead of the mockup's Barlow and
  IBM Plex Mono.
- **Commit `docs/design/`** on this branch and reference it from CLAUDE.md.

## Header spec (mockup layout × brand tokens)

- `position: fixed` at the top, `z-index: 20`. The background is dark
  `#1C1009` at 82% opacity with `backdrop-filter: blur(14px)`. The row is
  `space-between`, items centred.
- **Logo:** the `MARK_Logo.svg` wordmark (orange `#F47A36` M, cream `#FEF7EE`
  ARK), linking to `/#home`.
- **Nav** (wide only): Home, Profile, Skills, Portfolio, Contact, Impressum.
  Montserrat 400, letter-spacing 0.06em, cream at 82% opacity. Hover and
  focus-visible are orange, with a 0.3s colour transition.
  `/impressum`, when active, is orange with a 1px orange underline 4px below
  the text: the mockup's active treatment, which is only reachable for
  Impressum this increment.
- **Menu button** (narrow only): "MENU", Montserrat 400 11px, letter-spacing
  0.2em, uppercase. Two 1px bars (20px orange, 14px cream, right-aligned).
- **Breakpoint 860px.**

  | | narrow (base) | wide (≥860px) |
  |--|--|--|
  | padding | `12px 22px` | `30px 56px` |
  | logo height (visible) | 20px (≈104px wide) | 24px (≈125px wide) |
  | gap | 10px | 32px |
  | nav | hidden | flex, gap 30px, 13.5px |
  | Menu button | shown | hidden |

  The logo sizes respect the brand's suggested minimum: a wordmark ≥100px wide.
  They also respect its clear zone, 0.5× the M height (10–12px), which the
  header padding and gaps already exceed.

## Approach

### 1. Commit `docs/design/` (own commit)
`docs: add brand guidelines and logo assets`. This comes first, so the
implementation commits can reference it.

### 2. Design tokens + global base: `apps/digital-portfolio/src/styles.scss`
- `:root` custom properties from the brand palette, **only the ones the header
  uses**: `--color-orange` (#F47A36), `--color-cream` (#FEF7EE),
  `--color-dark` (#1C1009), `--color-nav` (cream 82%), `--color-header-bg`
  (dark 82%), `--font-sans` (Montserrat stack). The separator colour #B3A58F
  is not used by the header, so it waits.
- Base: `box-sizing: border-box`,
  `body { margin: 0; background: var(--color-dark); color: var(--color-cream);
  font-family: var(--font-sans) }`, `a { color: inherit; text-decoration: none }`.
- `scroll-behavior: smooth` only under
  `@media (prefers-reduced-motion: no-preference)`.

### 3. Font: self-host Montserrat via `@fontsource/montserrat`
Add the dependency and import only `latin-400.css` from `styles.scss`, since
the header uses no other weight. Weight 300 is added when the first consumer
needs it.
- *Alternative: a Google Fonts `<link>` (what the mockup does).* Rejected
  because loading fonts from Google's servers sends visitor IPs to Google. That
  was ruled a GDPR violation (LG München I, 2022), which matters for a site
  with a German Impressum. Self-hosting also removes a third-party request from
  the critical path.

### 4. Navigation content: `libs/data`
- `NavSection` type: `{ id: string; label: string }`.
- `PortfolioContent` service (`providedIn: 'root'`), following CLAUDE.md
  ("typed TS constants, injected via a service"). It exposes
  `readonly sections` (home, profile, skills, portfolio, contact), so the order
  and labels live in content, not markup. Scroll-spy will read the same list
  later.

### 5. Header component: `libs/ui` → `mj-site-header`
- Presentational, standalone, `OnPush`. It takes one input,
  `sections: readonly { id: string; label: string }[]`, exported from
  `@portfolio/ui`. The input type is structural because `ui → utils` only
  (`ui` can't import from `data`), and `data`'s `NavSection` satisfies it.
- **Logo: inline SVG** in the template, with the four paths from
  `MARK_Logo.svg` and fills via the tokens (same values). The viewBox is
  tightened from `180 170 1642 350` to the visible geometry `200 190 1600 308`,
  so CSS height equals visible height. This is a crop of empty canvas, so the
  proportions are unchanged, as the guidelines require. It gets `aria-hidden`;
  the link carries `aria-label="Mark Jungeblut, home"`.
  - *Alternative: `<img src="mark-logo.svg">` from `public/`.* Rejected because
    it adds a request for a 4-path, under-1KB asset. Inline also prerenders
    into the HTML and needs no load before first paint.
  - *Alternative: text "MARK" in the web font (the mockup).* Rejected: the
    brand guidelines explicitly forbid replacing the wordmark with typeset text.
- Markup: `<header>` → logo link → `<nav aria-label="Main">` with an `@for`
  over `sections` → `<a href="/#{{id}}">`, then
  `<a routerLink="/impressum" routerLinkActive ariaCurrentWhenActive="page">`
  → `<button type="button" class="menu">Menu</button>` (no handler yet; the
  bars are `aria-hidden`).
  - Hrefs are `/#id`, not `#id`, so they work the same from `/impressum`.
    *Alternative: `routerLink="/" [fragment]` + `withInMemoryScrolling`.*
    Rejected: per CLAUDE.md, in-page movement is anchors, not the router, and
    plain anchors need no router config.
- Styling is mobile first: the base is the narrow layout, and
  `@media (min-width: 860px)` switches to the wide one. The breakpoint is a
  local SCSS variable for now. It moves to a shared partial when a second
  consumer appears; `stylePreprocessorOptions` wiring isn't worth adding for
  one use.
- **44px tap targets:** the logo link, nav links and Menu button are
  `inline-flex; align-items: center; min-height: 44px`. The active underline
  is `text-decoration` with `text-underline-offset: 4px`, so it stays under
  the text rather than at the bottom of the 44px box.
- The active style hangs off `[aria-current]`. Colour transitions apply only
  under `prefers-reduced-motion: no-preference`.
- **No spec.** The component is purely presentational: one input in, markup
  out, with no branches or derived state of its own. `routerLinkActive` is
  Angular's tested directive. This falls under the guidelines' exception for
  presentational UI. Scroll-spy will add real logic and tests later.

### 6. Wire into the app shell
- `app.ts`/`app.html`: inject `PortfolioContent` and render
  `<mj-site-header [sections]="content.sections" />` above `<main>`. The
  placeholder `<h1>` stays; it may sit under the fixed header until the home
  section lands.
- `app.routes.ts`: `{ path: 'impressum', loadComponent: … }` →
  `ImpressumPage`, an empty placeholder component exported from
  `@portfolio/features/impressum`. The existing `**` → Prerender server route
  emits `impressum/index.html`.
- *Revised during implementation.* With `impressum` as the only route, the
  build stopped emitting the root `index.html` (with an empty config it had
  prerendered `/`; once routes exist, only declared paths are prerendered).
  Fixed by declaring `{ path: '', pathMatch: 'full', children: [] }`. Confirmed
  against a build of `main`'s empty route config.

### 7. CLAUDE.md
- Status: the header exists; everything else is still placeholder.
- Stack table, Styling row: Montserrat is self-hosted via `@fontsource` (no
  Google Fonts), and tokens live in `apps/digital-portfolio/src/styles.scss`.
  *As implemented:* the tokens location went into the Styling row, and the
  font rule got its own "Fonts" row.
- "The design is the spec": add `docs/design/` (brand guidelines + logo SVGs)
  as the authority for colour, typeface and logo. It outranks the mockup on
  those, and the logo is always the SVG asset, never typeset text. Keep it to
  facts, without restating values.

### Commits (Conventional Commits, no AI attribution)
1. `docs: add brand guidelines and logo assets`
2. `feat(ui): add site header` (+ nav content in data, tokens, font)
3. `feat: render header in app shell and add impressum route`
4. `docs: document header status and brand sources in claude.md`

## Acceptance criteria
- On `/` and `/impressum`, the prerendered HTML contains the header. The
  layout per viewport comes from CSS media queries only; no `window.innerWidth`.
- Below 860px: the logo and the Menu button are visible, and the nav is hidden.
  At or above 860px: the logo and all six nav links are visible, and the Menu
  button is hidden. Padding and sizes match the table above.
- Colours are the brand palette (#F47A36 / #FEF7EE / #1C1009). None of the
  mockup's #e8a05c / #f7f2ec / #17130f remain.
- The logo is the brand SVG wordmark, proportions intact, at least 100px wide
  at every viewport.
- Section links point to `/#home` … `/#contact`. Impressum navigates to
  `/impressum`, is prerendered there, and is marked `aria-current="page"` and
  underlined on that route.
- Every header link and the button are at least 44px tall.
- With `prefers-reduced-motion: reduce`, there is no colour transition and no
  smooth scroll.
- Montserrat loads from the site's own origin. There are no requests to
  `fonts.googleapis.com` or `fonts.gstatic.com`.
- `npm run verify` passes (build, typecheck, lint, test, format check).

## Out of scope
- Scroll-spy and active state for section links.
- The mobile full-screen menu overlay (the Menu button is inert until then).
- The Impressum overlay and its content (only an empty placeholder route).
- Page sections, the portrait column and the grid-column/photo transitions.
- Tokens the header doesn't use (separator, Montserrat 300, mono labels).
- Playwright / visual regression tests.

## Verification
- `npm run verify`.
- `npx nx serve digital-portfolio`: check at 390px and 1280px widths against
  `screenshots/01-check.png` (layout), allowing for the brand colours and font.
  Check hover/focus, that Impressum navigates and shows active, and that
  DevTools reduced-motion emulation disables the transitions. Confirm in the
  Network tab that no Google Fonts requests are made.
- Inspect `dist/apps/digital-portfolio/browser/index.html` and
  `impressum/index.html`: the header markup is present.

## Flagged, not fixed
- An inert Menu button is a mild a11y oddity (a control that does nothing).
  It is acceptable for one increment, but shouldn't ship to production without
  the overlay.
- The mockup's colours and fonts across the other sections are now superseded
  by the brand guidelines. Later increments should take colour and type from
  `docs/design/`, not the mockup.
- `index.html` still has `<title>digital-portfolio</title>` and `lang="en"`.
  This is unrelated to the header; leaving it as is.
- The favicon is still Angular's default. The brand suggests the M icon for
  favicons; that's a separate increment.

### Edge cases found in review, carried forward
- **Next increment: the mobile menu overlay.** Until it lands, narrow screens
  have no navigation at all (the nav is `display: none` and the Menu button is
  inert). Do not deploy before it exists.
- **First sections increment:** anchors will land under the fixed header. Add
  `scroll-padding-top` matching the header height (about 68px narrow, 104px
  wide), ideally as a `--header-height` token the header itself uses.
- **Playwright setup:** add a smoke test that `/` and `/impressum` both load
  from the static build. It guards the root-route regression above better than
  a unit test on the route config would.
- **Accepted:** section links from `/impressum` do a full page load (plain
  anchors, by design). The placeholder `<h1>` under the header goes away with
  the home section. An empty `sections` list degrades to just the Impressum
  link.
