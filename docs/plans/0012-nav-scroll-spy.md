---
created: 2026-10-25
updated: 2026-10-25
---

# Scroll-spy: mark the nav link of the section in view

Branch: `feat/nav-scroll-spy`

## Revision 3 — no jump on load

Mark: on refresh the marker still jumps from Home to the current section.
A frame-by-frame recording in Chrome of a load at `/#skills` shows two causes
stacked:

| Time | Visible |
|---|---|
| 36–126 ms | the prerendered per-label **rule under Home** (before hydration) |
| 126 ms | hydration: the bar appears in place — **at Home** |
| 130 ms | `nav--animated` switched on |
| 148–413 ms | the initial anchor scroll runs; the bar **slides Home → Skills** |

A browser-restored scroll on refresh takes the same path.

Same branch, same increment: committed on `feat/nav-scroll-spy` on top of
`a24df4b`, and archived together with Revisions 1–2 in one plan.

### Fix

1. **No pre-hydration rule when JavaScript runs** —
   `libs/ui/src/lib/site-header/site-header.scss`: the label's orange border
   for `[aria-current]` moves inside `@media (scripting: none)`. With JS the
   static page shows no marker; without JS it still shows Home as today.
   (Supported in every current engine; an old browser with JS off just shows
   no rule.) The `.nav--sliding` override becomes unnecessary and goes.
2. **Mark nothing until the page has settled** —
   `apps/digital-portfolio/src/app/active-section.ts`: on hydration
   (`afterNextRender`) set the signal to `null` and start the existing quiet
   hold (`holdUntilQuiet`) instead of measuring at once. The initial anchor
   scroll and any scroll restoration keep extending it through their scroll
   events; 150 ms after the last one it measures. The header then gets its
   first non-null section, and its existing first-placement rule makes the bar
   **appear in place at the right section** and animate only from the next
   move.
   - The prerendered value stays the first id, so the static HTML still
     carries `aria-current` on Home (for no-JS and its `scripting: none`
     rule).
   - Cost: the marker shows about 150 ms after hydration instead of at once.
     Nothing is visible before that, so nothing jumps.

### Follow-up fixes (found by Mark and a per-frame recording)

- **Text colour:** the prerendered `aria-current` still turned Home's text
  orange before hydration. The current link's colour now applies only under
  `.nav--sliding` (with the indicator) or `@media (scripting: none)`.
- **Text fade lagging the bar:** the links' colour transition now applies only
  under `.nav--animated`, so on load text and bar appear together.
- **Micro-slide after a font swap:** a re-measure that keeps the same current
  link (layout shift, resize) now snaps; only a change of link slides.
  `SiteHeader` remembers which link it last placed for.
- Recorded result, Chrome at 1440×900: at `/#skills`, at the top and after a
  scrolled reload, two states only — nothing, then text and bar together at
  the right section. Clicks still slide; `/impressum` lights Impressum; with
  JavaScript disabled Home is lit and ruled.

### Review fixes (Revision 3)

- **Deterministic "appears in place":** after writing a new place with
  motion off, `placeIndicator` forces a style flush
  (`getBoundingClientRect`) before arming `nav--animated` on the next frame,
  so the placement can't share a style change with the transition, whichever
  task (settle timer, ResizeObserver, render) led there. The pending frame is
  cancelled before a new one is requested.
- Tests: a link followed during the settle is marked at once and held; the bar
  slides between a section and the Impressum; a hide after rapid link changes
  leaves motion off. The header spec's fake `cancelAnimationFrame` now really
  drops the frame.

**Superseded by this revision** (earlier sections are kept as written):

- Revision 2 B: the label's rule is no longer the pre-hydration look, only the
  no-JS one (`scripting: none`), and `nav--sliding` no longer needs to hide it.
- Original Approach: the shell no longer measures "once immediately" after
  render; it waits for the page to settle. The rejected alternative "start
  with no active section until measured" is effectively adopted in the
  browser, while the prerendered HTML keeps Home for readers without
  JavaScript, which was the reason for rejecting it.

**Known limits, accepted:**

- The settle wait restarts on every scroll, so someone scrolling continuously
  from the first moment sees the marker once they pause for 150 ms.
- A scroll restoration landing more than 150 ms after hydration would show the
  pre-restore section first, then slide. Not seen in recordings.
- If the initial navigation's `NavigationEnd` reaches the subscription, a load
  at `/#section` marks the target at once (the click path) instead of after
  the settle. Either way the right section appears without a jump.
- Hover colour fades run only under `.nav--animated`, so they are absent
  during the settle and, once Contact exists, while no nav link is current.
- Checked in Chrome only; Safari and Firefox are untested by hand.

### Alternatives considered

- **Inline script in `index.html`** that hides the static rule before first
  paint (`<html class="js">`): works in older browsers too, but adds a
  render-blocking inline script and splits the header's styling between the
  component and the app's index page. `scripting: none` keeps it in the
  component. Rejected.
- **Measure at once, but suppress animation for the first N ms:** the bar
  would still visibly jump (without sliding) from Home to the section. Rejected.
- **Wait for `scrollend` / `load`:** `scrollend` isn't dependable in Safari;
  `load` can be late and doesn't cover the anchor scroll after it. The quiet
  hold already handles both. Rejected.

### Tests

- `active-section.spec.ts`: after hydration the value is `null` until the
  page has been quiet for 150 ms, then the measured section (replaces
  "measures once rendered"); scroll events during settling extend it. The
  rest switch to fake `setTimeout` throughout, with `render()` advancing past
  the settle.
- The header needs no new logic tests: `null` → section is the existing
  "appears in place" path. The `scripting` media query is CSS only; checked in
  a browser.

### Acceptance criteria

- Reload at `/#skills` (and a refresh with a restored scroll position): no
  marker under Home at any point; the bar appears under Skills without
  sliding.
- Load at the top: the bar appears under Home.
- With JavaScript disabled: Home is underlined, as before.
- Clicks, the lock and sliding behave as in Revision 2.
- `npm run verify` passes.

### Verification

- The same frame-by-frame Chrome recording at `/#skills`, at the top, and
  after a scrolled reload: no `rule=Home`, no bar at Home, no slide.
- Chrome with JavaScript disabled (DevTools emulation) at `/`: Home ruled.

---

## Revision 2 — sliding indicator and click lock

Added after the first implementation (commits `5e635bf`, `a7c93e0`) was
reviewed. Mark found it flaky: **after a click, e.g. Home → Portfolio, the
smooth scroll passes Profile and Skills, and the underline jumps across every
link on the way.** He picked a single sliding underline (alternative 2 from the
discussion). A sliding bar alone would still glide through the in-between
links, so this revision also locks the highlight to the clicked target while
the scroll runs. Everything below this section stays as implemented unless
named here.

### A. Click lock — `apps/digital-portfolio/src/app/active-section.ts`

- `watchActiveSection` also injects `Router`. On `NavigationEnd` whose
  fragment (`router.parseUrl(e.urlAfterRedirects).fragment`) is one of `ids`:
  set the signal to that fragment at once and **lock**: the scroll handler
  skips measuring while locked.
- Unlock after **150 ms with no scroll event**, then measure once. The timer
  starts at the navigation and restarts on each scroll event, so it also ends
  when the target is already in view (no scroll at all) and when the user
  takes over mid-scroll (unlocks once they stop). No `scrollend`: Safari
  support is too recent to rely on, and the debounce covers it.
- Covers every fragment link that goes through the router: nav, mobile menu,
  logo, hero buttons, scroll cue. Timer cleared on destroy.
- A repeat click on the link already in the URL emits `NavigationSkipped`
  (`IgnoredSameUrlNavigation`), not `NavigationEnd`, yet the router still
  anchor-scrolls; it locks the same way (found in review).
- Under `prefers-reduced-motion` the jump is instant, one scroll event, same
  path.

### B. Sliding indicator — `libs/ui/src/lib/site-header/`

- **Markup:** each desktop `.nav-link` (sections and Impressum) wraps its text
  in `<span class="nav-label">`. One `<span class="nav-indicator"
  aria-hidden="true">` inside `.nav`.
- **Underline geometry moves to the label**, as in the mockup:
  `padding-bottom: 4px; border-bottom: 1px solid transparent`, orange when the
  link is `[aria-current]`. Replaces the current `text-decoration` underline so
  the static fallback and the indicator sit on the exact same pixel. This is
  the **no-JS / pre-hydration look**: the same rule as today, though the
  label's padding lifts the text about 2px (as in the mockup).
- **Indicator:** `.nav` gets `position: relative`. The indicator is absolute,
  1px tall, 1px wide, `transform-origin: 0 0`, positioned by
  `transform: translate(var(--indicator-x), var(--indicator-y)) scaleX(var(--indicator-width))`
  (compositor-only; no layout per frame). Orange.
- **Measuring** (`SiteHeader`, `afterRenderEffect`, browser only):
  - `earlyRead`: find `.nav a[aria-current] .nav-label`; return its left,
    bottom − 1px and width relative to `.nav`'s rect, or `null` when nothing is
    current or the nav is hidden (narrow screens, width 0).
  - `write`: set the three custom properties on `.nav` and the classes:
    `nav--sliding` while a position exists (hides the per-label border, shows
    the indicator); without it the indicator fades out (e.g. a future Contact
    section in view, which matches no link).
  - Re-runs when `currentSection()` or `onImpressum()` change, and when a
    `ResizeObserver` on `.nav` reports a size change (breakpoint, font swap).
- **No slide on first placement:** transitions apply only under
  `.nav--animated`, added one animation frame after the first placement, so the
  bar appears in place instead of flying in from the left after hydration.
- **Motion:** `transform 0.3s ease` and the fade, matching the existing 0.3s
  nav transitions, only inside `prefers-reduced-motion: no-preference`; with
  reduced motion the bar jumps.
- On `/impressum` the bar slides to Impressum (the one current link), so it is
  the single "current" marker for the whole nav. Mark's "only Impressum is
  current" rule is unchanged.
- **Mobile menu unchanged:** orange item text, no indicator.

### Review fixes (this revision)

- Lock on `NavigationSkipped` / `IgnoredSameUrlNavigation` too (above).
- The indicator's `earlyRead` also tracks `onImpressum()`; the Impressum's
  `aria-current` comes from `RouterLinkActive` in a microtask and has landed
  by the time the phase runs.
- Hiding the indicator also drops `nav--animated` and cancels its pending
  frame, so every hidden → visible change appears in place; the frame is
  cancelled on destroy.
- Lock tests use fake timers instead of real waits.
- Left as is: on narrow screens a short last section can't reach the 35%
  line, so the hold falls back to the previous section once released. It
  predates this revision and only shows when the menu is reopened.

### Alternatives considered (this revision)

- **CSS anchor positioning** (`anchor-name` on the current link,
  `left: anchor(left)`, `width: anchor-size(width)`): no JS and correct before
  hydration, but switching anchors doesn't reliably animate, and Firefox/Safari
  support is too recent. Rejected.
- **View transitions** morphing the underline between links: animates for
  free, but a document view transition during an active scroll captures and
  freezes the page, and element-scoped transitions are Chromium-only. Rejected.
- **Animate `left`/`width`** instead of `transform`: simpler CSS, but layout
  every frame. Rejected in favour of `translate` + `scaleX`.
- **Lock until `scrollend`:** cleaner signal, but not dependable in Safari.
  Rejected for the debounce.
- **Lock in the header** (on link click): misses the hero buttons and scroll
  cue, which use the same anchor scroll. Rejected; the router sees all of them.

### Tests (this revision)

- `active-section.spec.ts` (provide a router with `withInMemoryScrolling` off):
  navigating to `/#portfolio` marks `portfolio` at once; scroll events with
  Profile past the line during the lock leave it on `portfolio`; after 150 ms
  of quiet it measures again; a navigation to a fragment not in `ids` doesn't
  lock; the timer is cleared on destroy.
- `site-header.spec.ts` (stub `ResizeObserver` and the label/nav rects):
  the indicator's custom properties match the current label's position, move
  when `activeSection` changes, point at Impressum on `/impressum`, and
  `nav--sliding` is removed when nothing is current. These assert positions,
  not styling: the position is the behaviour under test, and jsdom has no
  layout to observe otherwise.

### Acceptance criteria (this revision)

- Clicking a nav link (or a hero button / the scroll cue) marks the target
  immediately; the marker does not visit the sections scrolled past.
- After the scroll settles, normal scroll-spy resumes; a user scrolling
  during the lock is followed once they stop.
- On the wide layout there is one orange bar that slides between links; it is
  where the per-link underline would be, to the pixel, and does not fly in on
  load.
- With JavaScript off, the per-link underline still shows Home as current.
- With `prefers-reduced-motion: reduce`, the bar moves without animating.
- Mobile menu behaviour is unchanged.
- `npm run verify` passes.

### Out of scope (this revision)

- The mobile menu indicator (it stays orange text).
- Tuning the easing beyond the existing 0.3s; easy to change later.
- Contact (not built yet).

---

## Context

The header's section links have no active state; plans 0002 and 0010 deferred
it to "the scroll-spy increment", including the mockup's orange active item in
the mobile menu. The styling half already exists: `.nav-link[aria-current]` in
`libs/ui/src/lib/site-header/site-header.scss` is orange with an orange
underline (the Impressum link already uses it via `routerLinkActive`). What's
missing is knowing which section is in view and setting `aria-current` on its
link.

Mockup (`Portfolio Hero.dc.html`, `componentDidMount` / `renderVals`):

- Active section = the **last** `[data-sec]` element whose top has passed a
  line at **35% of the viewport height**; none passed → `home`.
- Computed on `scroll` (passive), throttled to one pass per animation frame,
  and once on mount.
- Desktop nav: active link orange + 1px orange underline, 0.3s colour/rule
  transition (already in our SCSS, already behind `prefers-reduced-motion`).
- Mobile menu: active item text orange, no underline.

Decided with Mark: while `/impressum` is open, **only** the Impressum link is
current; section links show no active state.

## Approach

Three layers, following the module boundaries:

1. **`libs/utils/src/lib/active-section.ts`** — pure, framework-agnostic:
   ```ts
   /** Id of the last section whose top is at or above `line`, else the first. */
   export function activeSection(
     tops: readonly { id: string; top: number }[],
     line: number,
   ): string | null
   ```
   Returns `null` only for an empty list. Exported from `@portfolio/utils`.

2. **App shell: `apps/digital-portfolio/src/app/active-section.ts`** — a
   `watchActiveSection(ids: readonly string[]): Signal<string | null>` helper
   (called in an injection context, like the existing `header-height.ts`
   sits next to `app.config.ts`):
   - Signal starts at the first id (`home`), so the prerendered HTML underlines
     Home — right for the usual load at the top.
   - In `afterNextRender` (browser only, never during prerender): look up each
     id with `document.getElementById`, measure `getBoundingClientRect().top`,
     feed `activeSection(tops, innerHeight * 0.35)`. Run once immediately, then
     on passive `scroll` and `resize`, coalesced with `requestAnimationFrame`.
   - Listeners and pending frame removed via `DestroyRef`.
   - `App` calls it with `content.sections.map(s => s.id)` and passes the
     signal to the header: `[activeSection]="activeSection()"`.

   Living in the shell, not the header, because the shell owns layout and the
   mockup's section-driven column widths / portrait position (a later
   increment) need the same signal.

3. **`SiteHeader` (`libs/ui`)**
   - New input `activeSection = input<string | null>(null)`.
   - Hide it on the Impressum: a `toSignal` of the router's `NavigationEnd`
     URL (the header already listens to router events) →
     `current = computed(() => onImpressum() ? null : activeSection())`.
   - Template: `[attr.aria-current]="section.id === current() ? 'location' : null"`
     on both the `.nav-link` and `.menu-link` loops. `aria-current="location"`
     is the right token for an in-page position (Impressum keeps `page`).
   - SCSS: `.menu-link[aria-current] { color: var(--color-orange); }`. The
     desktop rule needs no change.

### Alternatives considered

- **IntersectionObserver** with a thin `rootMargin` band at 35%. No per-frame
  layout reads, but a near-zero-height root makes "which section is under the
  line" fiddly (edge-adjacency, gaps when a band falls between callbacks), and
  it needs an IO mock in jsdom. Four `getBoundingClientRect` calls per frame
  are negligible. Rejected for this size of page.
- **`routerLinkActive` with fragments.** Only reflects the last clicked link,
  not the scroll position. Rejected.
- **Header does the measuring itself.** Fewer files, but the presentational
  ui lib would reach into the document for elements it doesn't own, and the
  portrait/column work couldn't reuse it. Rejected.
- **Start with no active section until measured.** Avoids a wrong underline
  when reloading on `/#skills`, but the static page would never show one
  without JS, and the top-of-page load is the common case. Rejected; the
  mismatch corrects itself on the first frame.
- **Underline both on `/impressum`** (the mockup). Rejected by Mark.

## Tests

- `libs/utils/src/lib/active-section.spec.ts` (new — gives utils its inferred
  `test` target): first id when nothing has passed the line; last passed id
  wins; a top exactly on the line counts; empty list → `null`.
- `apps/digital-portfolio/src/app/active-section.spec.ts`: stub section
  elements' `getBoundingClientRect` and `innerHeight`, dispatch `scroll`,
  flush rAF → signal follows; starts at the first id; listener removed on
  destroy.
- `site-header.spec.ts`: with `activeSection` = `skills`, the Skills link in
  both the Main and Mobile navs has `aria-current="location"` and the others
  none; none when `null`; none on section links after navigating to
  `/impressum`, while Impressum keeps `aria-current="page"`.

## Acceptance criteria

- Scrolling the page underlines the header link of the section whose top last
  passed 35% of the viewport; above the first section, Home is underlined.
- Exactly one section link is current at a time; it carries
  `aria-current="location"`.
- In the mobile menu the same section's item is orange.
- On `/impressum` only the Impressum link is current.
- Prerendered `/` shows Home as current without JavaScript; no scroll
  listener runs during prerender.
- Colour/underline transitions stay disabled under `prefers-reduced-motion`.
- `npm run verify` passes.

## Out of scope

- Section-driven column widths, portrait position and tint (mockup
  `wide` / `pos` maps) — they will consume the same signal later.
- The Contact section. Caveat found in review: `watchActiveSection` only
  measures the nav section ids, so once Contact sits below Portfolio,
  Portfolio would stay marked while Contact is in view. The Contact increment
  must pass every section id (Contact's id then matches no link, so none is
  current). Recorded in `CLAUDE.md`.
- Updating the URL fragment while scrolling.

## Docs

- `CLAUDE.md` Status: drop scroll-spy from "still to come"; one line under
  Workspace conventions: active section is computed in the app shell
  (`active-section.ts`) and passed to the header as `aria-current="location"`.

## Verification

- `npm run verify` (build, typecheck, lint, test, format check).
- `npm start`, then on desktop width scroll through all four sections and
  click each nav link; check the underline follows. Narrow width: open the
  menu at each section and check the orange item. Open `/impressum` and check
  only Impressum is marked.
- Inspect `dist/apps/digital-portfolio/browser/index.html`: Home link has
  `aria-current="location"`.
