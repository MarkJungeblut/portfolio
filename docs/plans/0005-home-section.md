---
created: 2026-10-20
updated: 2026-10-21
---

# Plan: home section (hero)

Branch: `feat/home-section`

## Context

The header, content column background and portrait are done. `<main>` is
still empty apart from the router outlet. The home section is the first
screen and holds the page's only `<h1>`, so it comes next. It is the first
section lib, `libs/features/home`.

From the mockup (`Portfolio Hero.dc.html`, lines 45–65 and `renderVals()`):

- **Section:** `min-height: 100svh`, a column flex box. Narrow: content is
  pushed to the bottom (`flex-end`) over the portrait, with padding
  `96px 22px 36px`. Wide: vertically centred, with padding
  `120px 48px 96px 56px`.
- **Content** (max-width 520px):
  - Eyebrow "Portfolio 2026": 11px, tracking .28em, uppercase, orange.
  - `h1` "I am Mark Jungeblut / and I am a **Software Architect**": 36/52px,
    line-height 1.16, weight 200, tracking −.01em. The role is orange at
    weight 300, followed by a blinking caret (2px × .92em, `steps(1)` at
    1.05s).
  - Lede: 15.5/16.5px, line-height 1.7, weight 300, cream 66%, max-width
    400px.
  - Actions, gap 18px, margin-top 40px:
    - Outlined button "Get to Know Me" → `#profile`. On hover it fills
      orange with dark text.
    - Uppercase text link "See the work" → `#portfolio`, cream 55% with an
      underline.
  - Socials "GitHub · LinkedIn · Mail": 11px, uppercase, tracking .16em.
    Narrow: static, 20px below the content. Wide: absolutely positioned
    `left: 56px; bottom: 40px`.
  - "↓ Scroll" cue → `#profile`, wide only, margin-top 56px, with a 2.6s
    `nudge` animation.

## Decisions (agreed with Mark)

- **Social URLs:** GitHub `https://github.com/MarkJungeblut` and LinkedIn
  `https://www.linkedin.com/in/mark-jungeblut/`. Mail links in-page to
  `#contact`.
- **Anchor scrolling gets fixed here.** `provideRouter` has no
  `withInMemoryScrolling`, so the header's `routerLink` + `fragment` links
  don't scroll today, and the hero CTAs would have the same problem.
- **Muted link contrast is raised to 55%** (the mockup has 38% and 50%), so
  the socials and the scroll cue reach about 6:1, which passes WCAG AA.

## Approach

### 1. Router: enable anchor scrolling

In `apps/digital-portfolio/src/app/app.config.ts`:
`provideRouter(appRoutes, withInMemoryScrolling({ anchorScrolling: 'enabled' }))`.

During implementation I'll check that the scroll lands below the fixed
header. If `ViewportScroller` ignores the existing `scroll-padding-top`, I'll
set the offset via `ViewportScroller.setOffset` instead, using the same
`--header-height` value.

### 2. Content: `libs/data`

Add a `hero` member to `PortfolioContent`
(`libs/data/src/lib/portfolio-content.ts`). It is a typed `HERO` const with
this shape:

```ts
interface SectionLink { readonly label: string; readonly section: string }
interface ExternalLink { readonly label: string; readonly url: string }
interface HeroContent {
  readonly eyebrow: string;          // 'Portfolio 2026'
  readonly name: string;             // 'I am Mark Jungeblut'
  readonly rolePrefix: string;       // 'and I am a'
  readonly role: string;             // 'Software Architect'
  readonly lede: string;
  readonly primaryCta: SectionLink;  // Get to Know Me → profile
  readonly secondaryCta: SectionLink;// See the work → portfolio
  readonly socials: readonly ExternalLink[]; // GitHub, LinkedIn
  readonly mail: SectionLink;        // Mail → contact
  readonly scrollCue: SectionLink;   // Scroll → profile
}
```

- The types stay **private to `libs/data`**. Only the feature consumes them,
  and it infers them through `inject(PortfolioContent).hero`. `ui` never
  sees them, so the deferred `libs/model` trigger doesn't fire yet.
- All copy is taken verbatim from the mockup. None of it is placeholder.

### 3. New lib: `libs/features/home`

- Generate it with the same flags that produced `features/impressum`
  (non-buildable, `--unitTestRunner=none`, prefix `mj`, tag `type:feature`,
  import path `@portfolio/features/home`). Then check that `project.json`
  matches impressum's (lint plus the `typecheck: {}` target) and delete the
  generator boilerplate.
- `HomeSection` (`mj-home-section`) goes in
  `src/lib/home-section/home-section.{ts,html,scss}`, with OnPush change
  detection. It injects `PortfolioContent` and renders
  `<section id="home" aria-labelledby="home-title">` with the markup above.
- In-page links use `routerLink="/"` + `[fragment]`, the same as the header,
  so they also work from `/impressum`, where they go back to `/` and scroll.
  GitHub and LinkedIn are plain `<a [href]>` and open in the same tab.
- Caret: a `::after` on the role span. It is decorative and gets no DOM node
  or `aria-hidden`.

### 4. Styles (mobile first, brand tokens only)

- **Fonts:** add `@fontsource/montserrat/latin-200.css` and `latin-300.css`
  to `styles.scss`. The mockup's IBM Plex Mono labels become uppercase,
  tracked Montserrat 400, as in the header's Menu button.
- **New global tokens** in `styles.scss`, derived from cream with
  `color-mix`:
  - `--color-text-muted`: 66%, the lede.
  - `--color-text-subtle`: 55%, the secondary link, socials and scroll cue.
  - `--color-outline`: 50%, the button border.
  - `--color-underline`: 24%, the text-link underline.
- **Section height:** `main` already reserves `--header-height` at the top.
  So the section is `min-height: calc(100svh - var(--header-height))`, and
  its top padding is the mockup's minus the header: 28px narrow and 16px
  wide. That makes the first screen exactly one viewport tall.
- **Wide** (`@use 'breakpoints' as *`): `justify-content: center`, the wide
  padding, `h1` at 52px, the lede at 16.5px. The socials become absolute
  (`left: 56px`, with `bottom` tuned so the text sits where the mockup puts
  it now that the targets are 44px tall), and the scroll cue is shown.
- **44px targets:** the button, text link, socials and cue all get
  `inline-flex` with `min-height: 44px`. The text-link underline uses
  `text-decoration` with an offset, like `.nav-link`, instead of a border.
- **Motion:** the caret blink, the cue nudge and the button/link transitions
  only run under `prefers-reduced-motion: no-preference`. With reduced
  motion the caret stays visible and static.
- Hover and `:focus-visible` share the same styles: the button fills orange,
  and the links turn orange.

### 5. App shell

`app.html`: `<main id="main"><mj-home-section /><router-outlet /></main>`.
`app.ts` imports `HomeSection` from `@portfolio/features/home`. It is eager,
not lazy, because it is the first paint.

### Alternatives considered

- **Hero as a `libs/ui` component with inputs, wired by the app.** Rejected.
  CLAUDE.md defines sections as feature libs that read content. A ui
  component would push content plumbing into the shell for no reuse.
- **Drop `main`'s `padding-top` and let each section pad itself**, as the
  mockup does. Rejected. It changes the shell and every future section,
  while the `calc` keeps the adjustment inside the one section that fills
  the first screen.
- **Plain `href="#profile"` instead of `routerLink` + fragment.** This works
  natively on `/` without the router fix. On `/impressum`, though, it would
  stay on that route, and it would be inconsistent with the header.
- **Caret as a `<span aria-hidden>`** (the mockup). A `::after` gives the
  same result with less markup and nothing for assistive tech to skip.
- **A typing animation for the role.** The mockup only blinks a caret, so it
  is not added.
- **Component-local `color-mix` instead of global tokens.** The muted, subtle
  and underline levels recur in every later section, so they are tokens now.

### Tests

None for `HomeSection`. It injects static content and renders it, with no
branch, derived state or handler, so it falls under the presentational
exception. The router change is configuration, so it is verified manually
(see Verification).

### Commits

1. `fix: enable anchor scrolling for in-page links`
2. `feat(home): add hero section` (lib, content, tokens, fonts, shell wiring)
3. `docs: note home section in claude.md`

## Acceptance criteria

- `/` prerenders a `<section id="home">` containing the page's single `<h1>`,
  with the eyebrow, lede, both CTAs, the socials and (wide only) the scroll
  cue, using the mockup's copy.
- Clicking "Get to Know Me", "See the work", Mail, Scroll or any header
  section link updates the fragment and scrolls (once those targets exist).
  The target is not hidden under the fixed header.
- Narrow (390×844): the hero sits at the bottom of the first screen over the
  portrait, with the socials below it and no scroll cue. Wide (1440×900): it
  is vertically centred in the left column, with the socials pinned
  bottom-left and the cue shown.
- The first screen is one viewport tall at both widths. There is no `vh`,
  only `svh`.
- Every interactive element is at least 44px tall. Muted text meets 4.5:1.
- With reduced motion emulated, nothing blinks, nudges or transitions.
- No mockup hex or rgba values, no Barlow or Plex Mono, and no Google Fonts
  requests. Only Montserrat 200/300/400 are imported.
- The GitHub and LinkedIn hrefs are exactly the two URLs above.
- `features/home` carries `type:feature` and imports only `data` (plus
  Angular). Boundaries lint clean.
- `npm run verify` passes.

## Out of scope

- Scroll-spy, active nav state, section-driven column widths, and portrait
  `object-position` or tint changes.
- The Profile, Skills, Portfolio and Contact sections. Their anchors are dead
  until they're built.
- The mobile menu overlay and the Impressum overlay.
- A `libs/model` lib (not triggered, see §2).
- Playwright and visual regression tests.

## CLAUDE.md

- Status: "Header and home section built". Add `home/` to the layout tree
  under `libs/features/`. Nothing else.

## Verification

1. `npm run verify`.
2. `npm start`. Check `/` at 390×844 and 1440×900 against
   `screenshots/01-check.png`, allowing for the brand font and colours.
   Check hover and focus on every link. In DevTools, check the computed
   heights of the targets (≥44px) and run a contrast check on the socials.
3. Emulate `prefers-reduced-motion: reduce`: the caret is static, and the cue
   and transitions are off.
4. Click the header logo and the hero links. The URL fragment updates and
   the page scrolls, smoothly unless motion is reduced. Repeat from
   `/impressum`.
5. Check the prerendered `dist/apps/digital-portfolio/browser/index.html`
   for the hero markup and the `<h1>`. Check the Network tab: there are no
   Google Fonts requests, and only the 200, 300 and 400 woff2 files load.

## Implementation notes

Deviations found while building, all within the approved intent:

- **Anchor offset fallback was needed.** `BrowserViewportScroller.scrollToElement`
  calls `window.scrollTo` with an explicit `top`, so CSS `scroll-padding-top`
  is ignored. `apps/digital-portfolio/src/app/header-height.ts` reads
  `--header-height` on every scroll (it changes at `$wide`) and is wired via
  `provideAppInitializer` → `ViewportScroller.setOffset`. Being logic, it has a
  spec (`header-height.spec.ts`, 3 tests). The server uses
  `NullViewportScroller`, whose `setOffset` is a no-op.
- **Hero types are exported, not private.** Lib typechecks emit declarations
  (TS4029), so `HomeSection.hero`'s type must be nameable. The interfaces are
  exported from `portfolio-content.ts` and `HeroContent` is re-exported
  type-only from `@portfolio/data`. Still in `data`, still off-limits to `ui`.
- **Lib config aligned with impressum.** The generator emitted neither the
  `typecheck: {}` target nor `tsconfig.spec.json`; both were added to match.
- **CLAUDE.md:** besides Status and the layout tree, the "Section libs … are
  not scaffolded up front" sentence now lists only the remaining four.

## Review follow-ups

From /review-implementation, applied with Mark's approval:

- **Scroll cue keeps its contrast.** The mockup's `nudge` faded it to 40%
  opacity, about 22% cream effective and below 4.5:1. The keyframes now move
  it only.
- **Anchor targets take focus.** `ViewportScroller.scrollToAnchor` calls
  `focus({ preventScroll: true })`, which does nothing on a plain
  `<section>`. `#home` gets `tabindex="-1"` (and no outline, since it isn't
  interactive), so the keyboard starting point follows the scroll. Every
  later section needs the same.
- **The heading has a space before its `<br>`,** so screen readers don't run
  "Jungeblut" into "and".
- **Hover only applies to devices that can hover.** An `active` mixin applies
  `:focus-visible` always and `:hover` only under `@media (hover: hover)`, so
  a tap on touch screens doesn't leave the button stuck orange.

Not changed, but added to manual verification: text contrast over the photo
on narrow screens (eyebrow and lede, not just the socials), and re-clicking a
fragment that's already in the URL. `headerHeight` using the global
`getComputedStyle` and assuming px is left as is.

## Post-review changes

Mark's call after the review:

- **GitHub and LinkedIn open in a new tab** (`target="_blank"`,
  `rel="noopener noreferrer"`). This changes the plan's "open in the same
  tab".
- **Mail is a `mailto:` link to `mark.jungeblut@gmail.com`**, not an in-page
  link to `#contact`. `hero.mail` is now a `MailLink` (`label`, `address`).
  This is the real address, so the mockup's `mark@jungeblut.dev` is dummy
  text and must not be used in the Contact section.
- **The intro is 540px wide, not 520px.** Montserrat 200 sets "I am Mark
  Jungeblut" 523px wide at 52px (measured in headless Chromium), so the
  mockup's 520px cap, sized for Barlow, broke the name onto two lines.
  Mark chose to keep Montserrat (brand) and fix the layout.
- **The scroll arrow is an inline SVG** (`.cue-arrow`, `aria-hidden`).
  Montserrat has no `↓` glyph, and the fallback font's came out tiny.
- **`headerOffset` became `headerHeight`,** in PR review. It returns the
  height as a `number`, and `app.config.ts` builds the `[x, y]` tuple that
  `ViewportScroller.setOffset` requires: `[0, headerHeight(document)]`. The
  function returns the one value it measures, and the 0 x-offset lives at
  the one call that needs it.
