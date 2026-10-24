---
created: 2026-10-21
updated: 2026-10-21
---

# Plan: profile section

Branch: `feat/profile-section`

## Context

The home section is done, but everything it points onward to is dead:
"Get to Know Me", the "↓ Scroll" cue and the header's Profile link all target
`#profile`, which doesn't exist. Profile is the next section in page order
and the smallest: an eyebrow, an `h2`, one paragraph and a three-stat grid.
It is the second section lib, `libs/features/profile`.

From the mockup (`Portfolio Hero.dc.html`, lines 67–91 and `renderVals()`):

- **Section:** column flex box, `justify-content: center`. Narrow:
  `min-height: auto`, padding `88px 22px 40px`. Wide: `min-height: 100vh`,
  padding `120px 48px 96px 56px`.
- **Content** (max-width 720px):
  - Eyebrow "Profile": 11px, tracking .28em, uppercase, orange, preceded by a
    34px × 1px orange rule (60%), gap 14px, margin-bottom 22px.
  - `h2`: 27/38px, line-height 1.2, weight 200, tracking −.01em.
  - Lede: margin-top 24px, max-width 560px, 15.5/16.5px, line-height 1.75,
    weight 300, cream 66%.
  - Stats: grid, 1 column narrow / 3 equal columns wide, 1px gap over a
    cream-12% background (hairline dividers), margin-top 46px. Each tile:
    padding `22px 24px`, dark background; value 30px weight 200 orange; label
    10.5px uppercase, tracking .18em, cream 50%, margin-top 8px.

## Decisions (agreed with Mark)

- **Heading:** "More than a decade of turning tangled requirements into
  systems teams can actually run." It stays true over time, and the exact
  figure lives only in the stat. The mockup's "Fifteen years" is wrong.
- **Stats:** `14+` Years shipping · `20` Developers in my org · `Remote`
  Germany · Oldenburg. All real.
- **Lede:** the mockup's paragraph, verbatim.

## Approach

### 1. Content: `libs/data`

Add a `profile` member to `PortfolioContent`
(`libs/data/src/lib/portfolio-content.ts`), a typed `PROFILE` const:

```ts
/** A headline figure and what it counts. */
export interface Stat { readonly value: string; readonly label: string }

/** Who Mark is, in a sentence, a paragraph and three figures. */
export interface ProfileContent {
  readonly eyebrow: string;   // 'Profile'
  readonly title: string;
  readonly lede: string;
  readonly stats: readonly Stat[];
}
```

Exported, and `ProfileContent` re-exported type-only from
`libs/data/src/index.ts`, for the same TS4029 reason as `HeroContent`.

### 2. New lib: `libs/features/profile`

- Generate it with the same flags as `features/home` (non-buildable,
  `--unitTestRunner=none`, prefix `mj`, tag `type:feature`, import path
  `@portfolio/features/profile`). Align `project.json` and
  `tsconfig.spec.json` with home's, delete generator boilerplate.
- `ProfileSection` (`mj-profile-section`) in
  `src/lib/profile-section/profile-section.{ts,html,scss}`, OnPush, injects
  `PortfolioContent` and renders
  `<section id="profile" tabindex="-1" aria-labelledby="profile-title">`.
  `tabindex="-1"` and `:focus { outline: none }` as on `#home`, so focus
  follows the anchor scroll.
- Eyebrow rule: a `::before` on the eyebrow, not a span (decorative).
- Stats are a `<ul>` of `<li>`s, value then label, so a screen reader reads
  "14+ Years shipping".

### 3. Styles (mobile first, brand tokens only)

- **Height and padding:** anchors already land below the fixed header (the
  `ViewportScroller` offset), so like home the top padding drops by the
  header height: 20px narrow (88 − 68), 16px wide (120 − 104). Wide
  `min-height: calc(100svh - var(--header-height))`, so a section fills
  exactly the visible area under the header. Narrow `min-height` stays auto.
- **Colours:** heading cream (the mockup's white), lede
  `--color-text-muted`, stat labels `--color-text-subtle` (the mockup's 50%
  is below the 4.5:1 floor), values and eyebrow `--color-orange`, tile
  background `--color-dark`, eyebrow rule a local `color-mix` of orange 60%.
- **New global token** `--color-hairline`: cream 12%, for the grid dividers.
  Hairline dividers recur in the later sections.
- The mockup's Plex Mono labels become uppercase Montserrat 400, as in home.
  No new font weights.
- No motion, no interactive elements.

### 4. App shell

`app.html`: `<mj-profile-section />` after `<mj-home-section />`. `app.ts`
imports `ProfileSection`.

### Alternatives considered

- **Extract the eyebrow + `h2` into a shared piece now** (a `libs/ui`
  `mj-section-heading`, or Sass mixins in `libs/ui/src/styles`). Every later
  section repeats them. Rejected for this increment: with one consumer the
  right shape is a guess. Extract when Skills lands as the second consumer.
  Same for home's `label` mixin, which profile repeats once.
- **Stats as a `<dl>`** (label `dt`, value `dd`). The pairing is semantically
  nicer, but `dt` must come first, so it either reads "Years shipping, 14+"
  or needs `column-reverse` to put the value on top. A list reads naturally.
- **Derive "14+" from the 2012 start year.** Stays current automatically,
  but adds logic (and a test) for a number that changes once a year, and the
  prerendered page only updates on a rebuild anyway. Kept static.
- **Keep the mockup's full `88px`/`120px` top padding.** That would leave a
  header-height gap above every section, since the scroll offset already
  clears the header.
- **Local `color-mix` for the dividers** instead of a token. The hairline
  recurs in later sections, matching how home introduced its text tokens.

### Tests

None. `ProfileSection` injects static content and renders it, with no branch,
derived state or handler, so it falls under the presentational exception.

### Commits

1. `feat(profile): add profile section` (lib, content, token, shell wiring)
2. `docs: note profile section in claude.md`

## Acceptance criteria

- `/` prerenders `<section id="profile">` after `#home`, with the eyebrow,
  an `h2` reading "More than a decade of turning tangled requirements
  into systems teams can actually run.", the verbatim lede, and the three stats above.
- "Get to Know Me", the scroll cue and the header's Profile link scroll to
  it, with the eyebrow not hidden under the header; the section takes focus.
- Narrow (390×844): stats stack in one column. Wide (1440×900): three equal
  columns with hairline dividers, content vertically centred in a section
  one visible-viewport tall.
- No `vh`, only `svh`. Stat labels meet 4.5:1.
- No mockup hex/rgba, no Barlow or Plex Mono, no new font imports.
- `features/profile` carries `type:feature` and imports only `data` (plus
  Angular). Boundaries lint clean.
- `npm run verify` passes.

## Out of scope

- Skills, Portfolio and Contact sections.
- Scroll-spy, active nav state, section-driven column widths and portrait
  position/tint (the mockup narrows the portrait to 40% on Profile).
- Mobile menu and Impressum overlays.
- A shared section-heading component or mixin (see alternatives).
- Keeping "14+" current: it needs a manual edit once it's 15+.
- Playwright and visual regression tests.

## CLAUDE.md

- Status: "Header, home and profile sections built". Add `profile/` to the
  layout tree under `libs/features/`, and drop `profile` from the "remaining
  section libs" sentence.

## Verification

1. `npm run verify`.
2. `npm start`. Check `/` at 390×844 and 1440×900 against the mockup,
   allowing for brand font and colours. Contrast-check a stat label.
3. Click "Get to Know Me", the scroll cue and the header's Profile link, from
   `/` and from `/impressum`: the page scrolls to Profile with the eyebrow
   just below the header, and a following Tab starts inside/after Profile.
4. Check `dist/apps/digital-portfolio/browser/index.html` for the profile
   markup and `h2`.

## Implementation notes

Deviations found while building, within the approved intent:

- **Stat grid switches on a container query, not `$wide`.** The wide content
  column stays at 40% of the viewport until section-driven column widths
  land, so three tiles overflowed below ~1300px ("Remote" needs ~143px per
  tile; tiles were 79px at 860). With Mark's approval, `.content` is an
  inline-size container and the grid goes to three columns from 440px of
  content width. Measured: one column at 390 and 860–1300, three at 1440 and
  1920, and also three at 700 (narrow layout), where they fit. No tile
  overflows at any measured width.

## Review follow-ups

From /review-implementation, applied with Mark's approval:

- **Threshold lowered from 460px to 440px.** At 1440 the content box is
  472px, so 460px left 12px of headroom; a classic scrollbar or zoom would
  drop it to one column. 440px stays above the ~431px minimum.
- **CLAUDE.md records container queries** under the breakpoint convention,
  so a later session doesn't swap the stat grid's query back to `$wide`.

Not changed: screen-reader reading of value + label (to check with
VoiceOver), label wrapping at ~510px narrow, the stock README, and
`gap` instead of `margin-top` on the label.
- **Lib config aligned with home.** As before, the generator emitted neither
  the `typecheck: {}` target nor `tsconfig.spec.json`; both were copied from
  `features/home`.
