---
created: 2026-10-25
updated: 2026-10-25
---

# Fix: tap highlight on Android Chrome (menu button, Impressum close)

## Context

On Android Chrome, tapping the header's **Menu** button or the Impressum's
**Close ×** link flashes a highlight. There are two causes, and neither is
handled outside the home section:

1. **Chrome's default tap highlight (the main cause).** Chrome on Android
   paints a translucent blue-grey box over any tapped `<a>` or `<button>`.
   That is `-webkit-tap-highlight-color`, and nothing in the repo sets it
   (`grep` finds no hits). It's the only effect that can hit the Menu button,
   which has no `:hover` style at all.
2. **Sticky `:hover` on touch (secondary).** After a tap, touch browsers keep
   `:hover` on the element under the last touch point. The home section
   already solved this in plan 0005 with an `active` mixin
   (`libs/features/home/src/lib/home-section/home-section.scss:11-22`). It
   applies `:focus-visible` always and `:hover` only under
   `@media (hover: hover)`. The site header and the Impressum still use bare
   `&:hover`. Example: Close × sits exactly where Menu was, so after a tap on
   Menu, Close × can open already stuck orange.

## Approach

1. **Global: switch off the tap highlight.** In
   `apps/digital-portfolio/src/styles.scss`, add
   `-webkit-tap-highlight-color: transparent;` to the existing `html` rule.
   The property is inherited, so one declaration covers every link and button
   in every lib, the dialogs included. Each control already gives its own
   feedback (colour change on focus-visible/hover, the dialog opening), so
   nothing is lost.
2. **Share the hover guard.** Move the `active` mixin out of
   `home-section.scss` into a new partial, `libs/ui/src/styles/_interaction.scss`.
   It goes next to `_breakpoints.scss`, which is already on the Sass include
   path (`apps/digital-portfolio/project.json` → `includePaths`). Then:
   - `home-section.scss`: `@use 'interaction' as *;`, delete the local copy.
   - `site-header.scss`: replace `&:hover, &:focus-visible { … }` on
     `.nav-link`, `.menu-close`, `.menu-link` and `.menu-footer-link` with
     `@include active { … }`. `.menu-link` keeps `&[aria-current]` as its own
     selector.
   - `impressum-page.scss`: same for `.close` and `.mail`.
3. **CLAUDE.md:** add one line under Workspace conventions. Hover styles go
   through the `active` mixin (`@use 'interaction'`), never bare `:hover`. The
   tap highlight is off globally.

### Alternatives considered

- **Per-component `-webkit-tap-highlight-color`:** rejected. Every link has
  the same flash (nav, menu links, mail link). The global rule is one line and
  can't be forgotten in the Contact section.
- **A brand-tinted tap highlight** (e.g. translucent orange) instead of
  transparent: rejected. It still paints a rectangle that ignores the
  controls' shapes and the design; the colour change already gives feedback.
- **`touch-action: manipulation`:** this addresses the tap *delay*, not the
  highlight. Not relevant here.
- **Duplicate the mixin in each lib** instead of sharing it: rejected. Three
  copies of the same rule drift. `libs/ui/src/styles` is already the shared
  Sass home.
- **Only part 1 (no hover change):** this is the minimum fix and possibly all
  you see. But the stuck-orange Close × is the same class of "highlight after
  tap" and was fixed for the home section on purpose. Drop part 2 at approval
  if you want the narrower change.

## Acceptance criteria

- No `-webkit-tap-highlight-color` box when tapping Menu, Close × (menu),
  Close × (Impressum) or any other link on Android Chrome.
- No bare `:hover` remains in app/lib SCSS. Every hover goes through `active`,
  so hover colours apply only on hover-capable devices, and `:focus-visible`
  styles are unchanged.
- Desktop hover and keyboard focus look exactly as before.
- `npm run verify` passes (build, typecheck, lint, test, format check).

## Tests

CSS only, with no logic in components, so no new unit tests (per Test
Requirements: presentational styling). Verified manually.

## Verification

- `npm run verify`.
- Built CSS: `grep` `dist/apps/digital-portfolio/browser` for
  `tap-highlight-color` and confirm hover rules sit inside `@media (hover:hover)`.
- On device: Android Chrome against `npx nx serve digital-portfolio --host 0.0.0.0`
  over LAN (or the Vercel preview of the PR). Tap Menu, Close ×, a menu link,
  Impressum, then Close ×, and check there's no flash and no stuck orange.
  Then check hover/focus on desktop.

## Out of scope

- Focus handling on dialog close (focus returning to Menu): not reported, and
  unchanged.
- The Zen touch-simulation double click (known simulator artefact, not an app
  bug).
- Any visual restyling of the controls.

## Added mid-session (Mark's request)

Remove the hero's "Portfolio 2026" eyebrow from the home section: on narrow
screens it sat right in front of the face. The `<p class="eyebrow">`, its
styles, and the now-unused `HeroContent.eyebrow` field and value are gone;
nothing else in the hero changes. Committed separately from the tap fix.
