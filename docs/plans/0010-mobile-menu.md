---
created: 2026-10-24
updated: 2026-10-25
---

# Mobile menu overlay

Branch: `feat/mobile-menu` (created).

## Context

Narrow screens hide the header nav and show only a "Menu" button
(`libs/ui/src/lib/site-header/`). The button toggles a `menuOpen` signal and
`aria-expanded`, but nothing opens. So on mobile there is no section navigation
and no way to reach the Impressum, which German law needs to be reachable.
Plans 0002 and 0009 both deferred this to "the menu increment", and 0009 asks
for the Impressum link in it.

The mockup's menu (`Portfolio Hero.dc.html` lines 223–239) is a full-screen
sheet in the page background colour:
- **Top row:** the MARK logo (links to `#home`) and a "Close ×" button on the right, 44px high.
- **Middle:** a numbered nav list. Each item is "01" in small orange text, then
  the label ("Home"…"Contact") in 36px weight-200 type. Each has 10px vertical
  padding and the items are 4px apart.
- **Bottom row:** a hairline rule on top, GitHub and LinkedIn on the left, and
  "Impressum" on the right. Uppercase, 11px, letter-spacing 0.16em, subtle
  colour, 44px tap targets.
- **Layout:** padding `18px 22px 36px`, column flex with `space-between`.
- **Behaviour:** every link closes the menu. The Impressum link closes the menu
  and opens the legal overlay.

**Impressum decision (Mark):** the Impressum keeps "Close ×" at the top right
on every width. The "← Back" idea is dropped. It already uses the same control
on desktop and mobile, so the mobile work is (a) the link to it from the menu
and (b) checking it by hand at phone width.

## Approach

### 1. The menu is a native modal `<dialog>`, inside `SiteHeader`

- Add a `<dialog id="mobile-menu" class="mobile-menu" aria-label="Menu">` to
  `site-header.html`. It is a sibling after `</header>`, because `:host` is
  `display: contents`. `aria-controls="mobile-menu"` on the button already
  points at it.
- **Not prerendered open.** It opens through `showModal()` from the button's
  click handler. Before hydration, `withEventReplay()` (already set up in
  `app.config.ts`) replays an early tap.
- `showModal()` gives the menu, with no extra code:
  - the top layer, so it covers the header without fighting z-index
  - the rest of the page made inert
  - focus moved into the menu
  - Escape to close
  - focus returned to the Menu button on close

  The existing global rule `html:has(dialog[open]) { overflow: hidden }`
  (`styles.scss`) already locks page scroll.
- **State:** `menuOpen` stays the source of `aria-expanded`.
  - `openMenu()`: `showModal()`, then `menuOpen.set(true)`.
  - The dialog's `(close)` event sets `menuOpen` to `false`. That covers every
    way of closing: Escape, the Close button, and any link.
  - The current `toggleMenu()` becomes `openMenu()`. While the menu is modal,
    the header button is inert, so it can never close the menu.
- **Close button:** `<button type="button" class="menu-close">Close <span aria-hidden="true">×</span></button>`.
  It calls `dialog.close()`. The accessible name is "Close", the same as the
  Impressum's.
- **Links:**
  - **Logo:** `routerLink="/" fragment="home"`.
  - **Sections:** `@for` over `sections()`, with `routerLink="/" [fragment]`.
  - **Impressum:** `routerLink="/impressum"`.
  - **Socials:** plain `href`, with `target="_blank" rel="noopener noreferrer"`
    as in the home section.

  Each link has `(click)="closeMenu()"`. The dialog closes synchronously and
  the router navigates after it, so the anchor scroll and the Impressum's
  `showModal()` both happen once the menu is gone. They never stack two modals.
- **Logo reuse:** the inlined SVG moves into an `<ng-template #logo>` that both
  the header and the menu render with `NgTemplateOutlet`. That leaves one copy
  of the paths and needs no new component.
- **Numbering:** "01"…"05" come from `$index`, through a small `protected`
  helper (`String(i + 1).padStart(2, '0')`).

### 2. Socials reach the header as an input

`libs/ui` may import only `utils`, so it can't inject `PortfolioContent`.
- Move `ExternalLink` from `libs/data/src/lib/portfolio-content.ts` to
  `libs/utils`, next to `NavSection`. This follows the existing pattern and the
  "shared types in utils" memory. `data` imports it from there.
  (`@portfolio/data` never exported it, so no import site changes.)
- Add `SiteHeader.socials = input.required<readonly ExternalLink[]>()`.
- In the app: `<mj-site-header [sections]="content.sections" [socials]="content.hero.socials" />`.

### 3. Styles (mobile first, brand tokens, `site-header.scss`)

- **The dialog:**
  - Full screen: `inset: 0; width: 100%; max-width: none; height: 100svh; max-height: none; margin: 0; border: 0`.
  - Background `var(--color-dark)`, padding `18px 22px 36px`.
  - Column flex with `justify-content: space-between`, but only while open:
    `&[open] { display: flex }`. Otherwise the author `display` would override
    the UA `display: none` on a closed dialog.
  - `overflow-y: auto` and `overscroll-behavior: contain`, for short landscape
    phones.
  - `::backdrop`: none needed, because the sheet is opaque and full screen.
- **Nav items:**
  - 36px, weight 200 (Montserrat 200 is already imported), 10px padding, 4px gap.
  - Number span: 10px, letter-spacing 0.16em, orange at 80% via `color-mix`.
  - Hover and focus turn the label orange.
- **Footer row:** `border-top: 1px solid var(--color-rule)`, uppercase 11px,
  letter-spacing 0.16em, `var(--color-text-subtle)`, 44px-high links.
- **Top row:** 44px min-height. The close button is styled like `.menu`, in
  `var(--color-text-subtle)`.
- **Mockup colours:** the mockup's mono font and hex colours are superseded by
  the brand: Montserrat, plus the existing tokens.
- **No `$wide` rule on the dialog.** Hiding an open modal with `display: none`
  would leave the page inert. See Decisions.
- **Motion:** transitions only on colour, inside
  `prefers-reduced-motion: no-preference`, as in the rest of the header.

### 4. Tests (`site-header.spec.ts`, Vitest + jsdom)

jsdom has no dialog behaviour, so stub `showModal` and `close` the same way as
`impressum-page.spec.ts`. Replace the toggle test with these behaviours, using
accessible queries:
- The Menu button opens the dialog, and `aria-expanded` becomes `true`.
- The Close button closes it, and `aria-expanded` returns to `false`.
- A `close` event from the browser (e.g. Escape) resets `aria-expanded`.
- The menu lists the sections in order, numbered "01", "02"…, with `/#id` hrefs.
- The menu holds a link to `/impressum` and the social links, which open in a
  new tab.
- Clicking a section link and clicking the Impressum link each close the menu.

The existing header-nav test scopes to `nav[aria-label="Main"]`, because there
are now two navs. The menu's nav is labelled `aria-label="Mobile"`.

### 5. CLAUDE.md

- **Status:** the mobile menu is built, and remaining work is scroll-spy and
  Contact. Drop the sentence "Until the mobile menu exists, narrow screens
  have no link to the Impressum".
- **Workspace conventions:** add "The mobile menu is a modal `<dialog>` owned
  by `mj-site-header`".

## Decisions and alternatives considered

- **`<dialog>` + `showModal()`** (chosen). It is the same primitive as the
  Impressum and gets focus trap, inert page, Escape and focus return for free.
  Alternatives:
  - **A `position: fixed` div:** needs a hand-built focus trap, `inert`
    toggling and an Escape handler.
  - **The Popover API:** opens with no JS through `popovertarget`, but it is
    not modal, so focus can leave the menu and the page stays live under it.
  - **Invoker commands** (`command="show-modal"`): declarative and works
    without JS, but links still need JS to close the menu. It also leans on
    attributes Angular's DOM schema doesn't know.
  - **CDK Overlay:** a new dependency for what the platform does.
- **Inside `SiteHeader`** (chosen), not a separate `mj-mobile-menu` component.
  The header already owns the button and its state. Splitting them means
  wiring open, close and `aria-expanded` across a component boundary for no
  reuse.
- **Logo through `ng-template`** (chosen), rather than extracting an `mj-logo`
  component. One copy, no new public API. Extract it later if a second
  component needs it.
- **No JS breakpoint listener to auto-close at `$wide`.** If a tablet rotates
  past 860px with the menu open, the full-screen menu stays until it is closed.
  That is harmless. Closing it from a `matchMedia` listener would mean typing
  860px a second time, in TS.

## Acceptance criteria

- Below 860px, tapping "Menu" opens a full-screen menu that matches the mockup
  in layout and spacing, in brand colours and type.
- The menu shows:
  - the logo
  - "Close ×"
  - Home…Contact, numbered 01–05
  - a footer with GitHub and LinkedIn on the left and Impressum on the right
- Every tap target is at least 44px high.
- Close ×, Escape and any link close the menu, and `aria-expanded` follows.
  Focus is trapped while it is open and returns to the Menu button after.
- Section links close the menu and scroll to the section, below the header.
- On mobile, Impressum in the menu closes the menu and opens the Impressum at
  `/impressum`. Its "Close ×" (top right), Escape and the browser's back
  button all return to the page.
- Page scroll is locked while the menu is open.
- At 860px and wider, nothing visible changes.
- The prerendered HTML contains the menu closed.
- `npm run verify` passes.

## Out of scope

- **Scroll-spy, and the mockup's orange active item in the menu.** That comes
  with the scroll-spy increment.
- **The Contact section.** The menu's Contact link points at `#contact`, which
  doesn't exist yet, the same as the desktop nav.
- **Open and close animations.** The mockup has none.
- **Changing the Impressum's control or position.** It stays "Close ×".

## Review follow-ups (from /review-implementation, agreed with Mark)

1. **The menu numbers are `aria-hidden`.** Otherwise screen readers announce
   "01Profile". The visible "01" stays.
2. **Tests assert accessible names.** Links read "Profile", not "01Profile",
   and the numbers are checked separately. Buttons are found by accessible
   name ("Menu", "Close"). The social links' `rel` is asserted, and following
   a social link closes the menu.
3. **`openMenu()` skips `showModal()` when the menu is already open.** Two
   taps replayed from before hydration would otherwise make older engines
   throw `InvalidStateError`. `closeMenu()` likewise only closes an open
   menu.
4. **Any router `NavigationStart` closes the menu.** On iOS, a swipe back
   changes the route but leaves an open dialog alone. With the menu open,
   going back to `/impressum` would stack the Impressum over the menu.
5. **Not fixed: focus after a section link** returns to the Menu button
   rather than moving to the section. The desktop nav behaves the same.

## Flagged, not fixed

- **Re-tapping a section link** while that fragment is already in the URL may
  not scroll. The router ignores same-URL navigation by default. If so, this
  affects the desktop nav too. I'll check it by hand and report back.
- **Closing the Impressum pushes `/` onto the history.** So the browser's back
  button reopens it. This predates this increment.
- **The menu opens and closes at once in Firefox/Zen Responsive Design Mode
  with touch simulation on** (found 2026-10-25, Zen 1.21.16b / Gecko 154).
  This is a devtools artefact, not an app bug. The page sometimes gets two
  clicks: the first opens the menu, and the second lands on "Close ×", which
  sits exactly where "Menu" was.
  - The cause is in Gecko's
    `devtools/server/actors/emulation/touch-simulator.js`. On mouseup it fires
    an async synthesized touch, which the browser turns into a click. It also
    registers a one-shot click listener to swallow the real mouse click. If
    the touch-generated click arrives first, the listener is used up on it
    (and ignores it, since it isn't mouse input), so the real click also gets
    through.
  - It's intermittent, so it looked like a "slow" menu. Headless measurements
    are fast: Chrome and Zen open the menu in about 50 ms, and the handler
    takes under 16 ms.
  - To test, turn touch simulation off (the hand icon) or use a narrow normal
    window. To confirm the double click, log
    `pointerdown`/`pointerup`/`click` in the console.
  - Real phones send one click per tap. A real double tap on "Menu" still
    opens and then closes it, since "Close ×" sits under the finger. The
    recommendation is to keep this toggle behaviour; Mark hasn't decided yet.
    The alternatives are a ~300 ms close guard or moving "Close ×".

## Verification

1. `npm run verify`: build, typecheck, lint, test and format check.
2. Run `npm start` in a 390px viewport and check, by hand:
   - opening the menu, closing it with ×, Escape and each link
   - Tab staying inside the menu
   - focus returning to the Menu button
   - Impressum in the menu opening the overlay, and that overlay closing back
     to the page
   - page scroll locked while the menu is open
   - 44px tap targets
   - the layout at 860px+ unchanged
3. Check that `dist/apps/digital-portfolio/browser/index.html` contains
   `<dialog id="mobile-menu"` without `open`.

## Follow-up: initial dialog focus

### Context

In Safari, a blue box appears around "Close ×" when the Impressum opens. That
box is Safari's default focus ring. When a dialog opens with `showModal()`, the
browser moves focus to the first thing in it that can be focused:
- **The Impressum:** the "Close ×" link.
- **The mobile menu:** the logo link.

Safari shows the ring for that focus even after a mouse click or tap. Chrome
shows no ring after a pointer click. So in Safari it looks like a stray border,
and it also suggests a keyboard selection the visitor never made.

Intended outcome: when either dialog opens, no element inside shows a ring.
Keyboard users keep full visible focus once they press Tab, and screen readers
still announce the dialog by its name.

### Approach: focus the dialog itself

Make the dialog element the starting point for focus. This is a common pattern
for dialogs that mostly hold content.

1. **Impressum** (`libs/features/impressum/src/lib/impressum-page/`)
   - Template: add `tabindex="-1"` to the `<dialog>`, so a script can focus
     it but Tab never lands on it.
   - `impressum-page.ts`: in the `afterNextRender` upgrade, call
     `dialog.focus()` right after `dialog.showModal()`.
   - SCSS: add `.dialog:focus { outline: none; }`. This only drops the ring
     on the dialog box itself, which can't be clicked or typed into. Links
     inside keep their rings, and pressing Tab moves to "Close ×" with a
     visible ring.
2. **Mobile menu** (`libs/ui/src/lib/site-header/`)
   - Template: add `tabindex="-1"` to the menu `<dialog>`.
   - `site-header.ts`: in `openMenu()`, call `menu.focus()` after
     `showModal()`.
   - SCSS: add `.mobile-menu:focus { outline: none; }`.

Screen readers: a focused `<dialog>` is announced by its `aria-labelledby`
(the "Angaben gemäß § 5 DDG" heading) or by `aria-label="Menu"`. Reading then
starts at the top of the dialog, not at "Close". Focus still returns to the
element that opened the dialog when it closes.

### Alternatives considered

- **`autofocus` on the `<dialog>`.** This is the standard, markup-only way to
  say "focus the dialog itself". Browsers adopted this rule only recently,
  and I'm not sure which Safari version honours it. Calling `focus()` after
  `showModal()` works in every engine.
- **`outline: none` on the links.** Rejected. It removes the focus indicator
  for keyboard users, which is a WCAG 2.4.7 failure.
- **A brand-coloured `:focus-visible` ring.** This makes the ring look nicer
  but still shows it on open. It is worth doing in its own increment
  site-wide (flagged below), not as this fix.
- **Moving focus to the heading.** That would need `tabindex` on a heading
  and gives no benefit over focusing the dialog.

### Tests

- `impressum-page.spec.ts`: after the upgrade, `document.activeElement` is
  the dialog.
- `site-header.spec.ts`: after the Menu button is clicked,
  `document.activeElement` is the menu dialog.
- jsdom doesn't move focus on `showModal()`, so these tests check the
  explicit `focus()` call through its effect, the active element.

### Acceptance criteria

- In Safari, opening the Impressum, by click or by loading `/impressum`
  directly, shows no ring on "Close ×". The same holds for the mobile menu's
  logo.
- After opening, pressing Tab moves to the first link with a visible ring.
  The focus trap and Escape still work. Focus returns to the opener on close.
- `npm run verify` passes.

### Out of scope / flagged

- **Site-wide focus styling.** Links and buttons use the browser's default
  focus ring, blue in Safari. A brand `:focus-visible` style (e.g. an orange
  outline) would be a separate, design-level change.

### Verification

1. `npm run verify`.
2. Mark checks in Safari:
   - the Impressum opened from the header link
   - `/impressum` loaded directly
   - the mobile menu in a narrow window
   - Tab from each dialog shows the ring on the first link
