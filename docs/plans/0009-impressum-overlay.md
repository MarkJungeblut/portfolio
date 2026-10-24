---
created: 2026-10-24
updated: 2026-10-24
---

# Plan: Impressum overlay

Branch: `feat/impressum-page`

## Context

`/impressum` is a prerendered route that today renders only an empty
`<section id="impressum">` (`libs/features/impressum/src/lib/impressum-page.ts`).
The header already links to it, and `routerLinkActive` sets `aria-current`, so
the link turns orange while the route is active. This increment builds the
legal notice as the mockup's overlay: on wide screens a side panel over the
page, on narrow screens a full-screen sheet. The URL stays real and directly
linkable, as CLAUDE.md requires.

From the mockup (`Portfolio Hero.dc.html`, lines 203–222 and `renderVals()`):

- **Backdrop:** fixed, full screen, `rgba(10,8,6,.72)` with an 8px blur.
  Clicking it closes the overlay.
- **Panel:**
  - Wide: fixed to the right edge, full height, `min(680px, 54vw)`, padding
    `90px 64px 64px`.
  - Narrow: `inset: 0`, full width, padding `76px 22px 48px`.
  - Both: scrolls on overflow (`overflow-y: auto`), background `#1d1712`,
    a 1px orange-35% left border, `box-shadow: -30px 0 80px rgba(0,0,0,.5)`.
- **Close link:** "Close ×", absolutely positioned at top 26 / right 30,
  11px uppercase, tracking .18em, cream 55%, orange on hover.
- **Content** (max-width 660px):
  - The ruled eyebrow "Impressum" and the `h2`, styled like the other section
    headings (27px narrow, 38px wide).
  - A label/value grid: one column on narrow, `repeat(2, minmax(0,1fr))` on
    wide, gap `16px 28px`. Values are 15px, line-height 1.7, weight 300,
    cream 72%. Labels are 10.5px uppercase, tracking .18em, cream 45%,
    padding-top 4px.
- **No open/close animation** in the mockup: it toggles `display`.

The mockup's data (Musterstraße, DE000000000, the placeholder note) is
discarded. The data and German wording come from `docs/mockup/ImpressumPage.tsx`.

## Decisions (agreed with Mark)

- **Heading: "Angaben gemäß § 5 DDG".** The source says TMG, which the DDG
  replaced in May 2024. All other wording is verbatim from
  `ImpressumPage.tsx`.
- **One overlay, two shapes, switched by CSS at `$wide`.**
  - Desktop: a right-hand sidebar over the dimmed, blurred page.
  - Mobile: the same dialog full screen, covering the header, so it reads as
    a page of its own.
  - Both share the one URL `/impressum`, and closing either returns to `/`.
- **Mobile reachability is left to the mobile menu increment.** Narrow
  screens hide the header nav. On mobile the Impressum opens from the
  "Impressum" link in the mobile menu, as in the mockup. Until that menu is
  built, phones reach it only by direct URL. Flagged here so it doesn't get
  forgotten: the menu increment must include that link.

## Approach

### 1. Content: `libs/data`

New types in `portfolio-content.ts`, exported type-only from `index.ts`:

```ts
/** The legal notice: who is responsible, how to reach him, the disclaimer. */
export interface ImpressumContent {
  readonly eyebrow: string;      // 'Impressum'
  readonly title: string;        // 'Angaben gemäß § 5 DDG'
  readonly responsible: { readonly label: string; readonly lines: readonly string[] };
  readonly contact: { readonly label: string; readonly prefix: string; readonly address: string };
  readonly disclaimer: { readonly label: string; readonly text: string };
}
```

- Values:
  - `responsible`: "Verantwortlich" with the lines Mark Jungeblut /
    Tannenkampstraße 27 / 26160 Bad Zwischenahn / Deutschland.
  - `contact`: "Kontakt", with the prefix "E-Mail:" and the address
    `mark.jungeblut@gmail.com`.
  - `disclaimer`: "Haftungsausschluss", with the paragraph verbatim from the
    source.
- The address is hoisted into one `MAIL_ADDRESS` constant, used by both
  `HERO.mail` and the Impressum, so the two can't drift apart.
- `PortfolioContent` gets an `impressum` member.

### 2. Component: `libs/features/impressum`

`ImpressumPage` (`mj-impressum-page`) moves to
`src/lib/impressum-page/impressum-page.{ts,html,scss}`. It is OnPush, injects
`PortfolioContent` and `Router`, and imports `RouterLink` and `SectionHeading`.

```html
<dialog #dialog class="dialog" open aria-labelledby="impressum-title"
        (click)="onDialogClick($event)" (close)="onClose()">
  <div class="panel">
    <a class="close" routerLink="/" (click)="close($event)">Close <span aria-hidden="true">×</span></a>
    <div class="content" lang="de">
      <mj-section-heading [eyebrow]="impressum.eyebrow" [heading]="impressum.title" headingId="impressum-title" />
      <dl class="details">
        <dt>Verantwortlich</dt> <dd>lines joined with <br></dd>
        <dt>Kontakt</dt>        <dd>E-Mail: <a href="mailto:…">…</a></dd>
        <dt>Haftungsausschluss</dt> <dd>paragraph</dd>
      </dl>
    </div>
  </div>
</dialog>
```

**A native `<dialog>`, upgraded to modal after render:**

- The prerendered HTML contains `<dialog open>`. Without JavaScript, the
  notice is visible as a fixed panel, and the close link is a plain
  `href="/"`.
- `afterNextRender` (browser only, so it runs after hydration and after
  client-side navigation alike) calls `close()` and then `showModal()`.
  `showModal()` throws on a dialog that is already open but not modal.
- Modal mode brings the following for free:
  - the top layer above the fixed header;
  - `::backdrop`;
  - a focus trap, with focus starting on the Close link;
  - an inert page behind the dialog;
  - Escape to close.

**All close paths go through `dialog.close()`.** The `close` event handler
then navigates to `/`:

- Close link: `preventDefault`, then `dialog.close()`.
- Backdrop: a click whose `target` is the `<dialog>` itself. The `.panel`
  fills the dialog, so clicks inside the panel never match.
- Escape: native, and fires `close`.
- `onClose()` navigates only when `!dialog.open`. That guard ignores the
  close event queued by the `close()` → `showModal()` upgrade: the dialog is
  open again by the time that event fires.
- Because the native close restores focus to the element focused before
  opening (the header's Impressum link), keyboard users land back where they
  started.
- Closing pushes `/` onto the history, so Back reopens the Impressum. That
  is the expected behaviour for a routed overlay.
- No `scrollPositionRestoration` change: closing keeps the page where it was.

**`lang="de"`** on the content, so screen readers pronounce the German text
correctly. The site is `lang="en"`, and "Close" stays English, as site
chrome.

### 3. Styles (mobile first, brand tokens only)

- `:host { display: contents }`.
- **Dialog:** UA styles reset (margin, border, max sizes, padding 0,
  colour inherit), `position: fixed`, `overflow-y: auto`.
  - Base: `inset: 0`, `width: 100%`, `height: 100svh`.
  - At `$wide`: `inset: 0 0 0 auto`, `width: min(680px, 54vw)`, full height,
    left border in `color-mix(--color-orange 35%)`, plus the mockup shadow.
  - Background: `--color-dark-lifted`, the brand equivalent of `#1d1712`.
- **`::backdrop`:** `color-mix(in srgb, var(--color-dark-deep) 72%,
  transparent)` with `backdrop-filter: blur(8px)`.
- **Panel:** `min-height: 100%`, padding `76px 22px 48px`, and
  `90px 64px 64px` at `$wide`.
- **Close link:** absolute at top 26 / right 30 (narrow: right 22),
  `min-height: 44px`, inline-flex centred, 11px uppercase, tracking .18em,
  `--color-text-subtle`, `--color-orange` on hover and focus-visible.
- **Heading:** `mj-section-heading` reused as-is. The `h2` takes 34px margin
  below, set on the `dl`'s top margin, as other sections do.
- **`dl` grid:** base one column with gap `16px 28px`; at `$wide` the
  mockup's two columns. Mobile first, so a `min-width` query only.
  - `dt`: 10.5px uppercase, tracking .18em, padding-top 4px, colour
    `--color-text-subtle`. The mockup's 45% is raised to the text-contrast
    floor.
  - `dd`: margin 0, 15px, line-height 1.7, weight 300,
    `--color-text-muted`.
  - The mail link gets the existing underline token (`--color-underline`)
    so it reads as a link.
- **Global scroll lock:** `html:has(dialog[open]) { overflow: hidden }` in
  `styles.scss`. It is plain CSS, so it applies in the prerendered HTML too,
  with no JavaScript touching `body.style`.
- **Motion:** only the close link's colour transition, inside
  `prefers-reduced-motion: no-preference`, as in the header. No open
  animation, matching the mockup.
- Mono becomes Montserrat 400 and Barlow becomes Montserrat 300, as
  elsewhere. No new tokens or font weights.

### 4. App shell

`<router-outlet />` moves out of `<main>` to after `<mj-portrait />` in
`app.html`:

- `main` is `position: relative; z-index: 1`, a stacking context. Without
  JavaScript, a fixed dialog inside it would sit under the header (z-index
  20).
- It is also semantically right: the Impressum isn't part of the scrolling
  page content.
- The host's `display: contents` and the fixed dialog keep the wide grid
  unaffected. To be checked at 1440: the empty outlet element must not shift
  the layout.

### Alternatives considered

- **`div role="dialog" aria-modal="true"` with a hand-written focus trap,
  Escape listener and background `inert`.** Everything native `<dialog>`
  provides for free, rebuilt by hand. `inert` would also mean the feature
  reaching into the shell's DOM, which breaks the boundary. Rejected.
- **`@angular/cdk` Dialog.** It adds a dependency, opens imperatively, and
  renders into an overlay container. The content wouldn't be in the
  prerendered HTML of a route that must be directly linkable. Rejected.
- **Prerender the dialog closed and open it only in the browser.** Simpler
  upgrade logic, but `/impressum` would be blank without JavaScript, which
  defeats SSG for the one page with legal weight. Rejected.
- **`closedby="any"` for light dismiss.** This would remove the backdrop
  click handler, but Safari support is not yet reliable. The handler is four
  lines. Rejected for now.
- **A plain standalone page instead of an overlay.** It contradicts the
  design. Rejected.
- **A generic `{label, lines}[]` list for the content.** The contact entry
  needs a mailto link and the disclaimer is prose, so a fixed, typed shape
  matches the fixed template better.

### Tests

`ImpressumPage` has logic (the upgrade, the backdrop target check, the close
guard, navigation), so it gets
`libs/features/impressum/src/lib/impressum-page/impressum-page.spec.ts`. The
spec gets a `test` target automatically.

jsdom 27 has no `showModal` or `close`. The spec stubs both on
`HTMLDialogElement.prototype`: they toggle `open`, and `close()` dispatches
`close` asynchronously, as browsers do. The tests query by role and text:

- renders a dialog named "Angaben gemäß § 5 DDG", with the responsible
  person and address, the mailto link and the disclaimer;
- opens as a modal after render (`showModal` called);
- the Close link has `href="/"`, and clicking it navigates to `/`;
- a click on the dialog itself (backdrop) navigates to `/`, and a click
  inside the panel does not;
- a native close (Escape) navigates to `/`;
- the upgrade's own close event does not navigate.

Navigation is asserted through `Router` with `provideRouter([])` and a spy
on `navigateByUrl`/`navigate`, as the header spec does.

### Commits

1. `feat(impressum): add impressum overlay` (content, component, styles,
   spec, outlet move, scroll lock)
2. `docs: note impressum overlay in claude.md`

## Acceptance criteria

- `dist/apps/digital-portfolio/browser/impressum/index.html` contains
  `<dialog open>`, labelled by `h2#impressum-title` "Angaben gemäß § 5 DDG".
  It shows:
  - Verantwortlich: Mark Jungeblut, Tannenkampstraße 27, 26160 Bad
    Zwischenahn, Deutschland;
  - Kontakt: E-Mail with a `mailto:mark.jungeblut@gmail.com` link;
  - the Haftungsausschluss paragraph, verbatim.
- No Musterstraße, DE000000000, USt-IdNr., phone number or placeholder note
  anywhere.
- With JavaScript:
  - opening `/impressum` (direct load or the header link) shows a modal
    dialog over the page and header, with the backdrop;
  - focus is inside the dialog and Tab stays there;
  - the page behind doesn't scroll.
- The Close link, a backdrop click and Escape each close the overlay and
  land on `/`. The scroll position is kept when opened from within the page.
  After a keyboard close, focus returns to the header link.
- The header's Impressum link is orange with `aria-current="page"` while
  open.
- **Layout:**
  - 390×844: a full-screen sheet.
  - 1440×900: a right-hand panel `min(680px, 54vw)` wide with the left rule.
  - Labels and values stack on narrow and form two columns on wide.
  - The Close link is a ≥44px tap target.
  - No horizontal overflow.
- `svh` only. Label and value text meet 4.5:1. Brand tokens only, no mockup
  hex values.
- `features/impressum` imports only `data` and `ui` (plus Angular).
  Boundaries lint clean.
- The new spec passes, and `npm run verify` passes.

## Out of scope

- The mobile menu overlay and its Impressum link (next increment, see
  Decisions).
- The Contact section, scroll-spy, and the mockup's section-driven
  column widths and portrait position for `impressum`.
- Route `title`s. `index.html` still says `<title>digital-portfolio</title>`
  for every page. That is a separate fix worth doing, flagged here.
- An open/close animation.
- Playwright and E2E tests for the real-browser dialog behaviour. These are
  verified manually below.

## CLAUDE.md

- Status: "…and the Impressum overlay built". Remaining: the mobile menu,
  scroll-spy and Contact. Drop "`/impressum` is an empty placeholder route".
- Routing table: `/impressum` is a native modal `<dialog>`, prerendered
  `open` and upgraded with `showModal()` after render. The router outlet
  sits outside `<main>`.
- Content caveat: the heading cites § 5 DDG (Mark's decision, superseding
  the TMG in `ImpressumPage.tsx`).

## Verification

1. `npm run verify`.
2. `npm run build`, then inspect `dist/.../browser/impressum/index.html` for
   the dialog markup and content.
3. `npm start`. In a browser at 390×844 and 1440×900:
   - Open the overlay via the header link and via a direct load of
     `/impressum`.
   - Check the backdrop, the panel geometry and focus trapping.
   - Close via Esc, the backdrop and the Close link. Each should land on
     `/` with the scroll position intact.
   - Confirm the page behind doesn't scroll and the grid is unchanged.
4. Serve the static build (`npx nx serve-static digital-portfolio`) with
   JavaScript disabled. `/impressum` should show the panel above the header,
   and Close should go to `/`.

## Implementation notes

Deviations found while building, within the approved intent:

- **The Close link is a plain `href="/"`, not `routerLink`.** `RouterLink`'s
  own click handler would navigate straight away and destroy the dialog
  without `close()`, skipping native focus restoration. The plain href is
  still the no-JavaScript fallback.
- **`.dialog` has `z-index: 40`.** Without JavaScript the non-modal dialog
  otherwise sat under the fixed header (z-index 20), covering the Close link.
  The top layer ignores z-index once modal.
- **The address is one string joined with `\n` under `white-space:
  pre-line`, not `<br>`s.** Prettier mangled the inline `@for` / `@if` /
  `<br>` construct. Block spans, tried first, left no separator in the DOM
  text (see Review follow-ups).
- **The Close link has `gap: 0.5em`.** As inline-flex items, "Close" and "×"
  lost the space between them.
- **The template disables two a11y lint rules on the `<dialog>`**
  (`click-events-have-key-events`, `interactive-supports-focus`), with a
  comment. The click is the backdrop's light dismiss, and Escape plus the
  Close link are its keyboard equivalents.
- **Close position:** top 12px, so the 44px tap target centres on the
  mockup's 26px text top.
- **Checked in headless Chrome against the static build:**
  - 1440: a modal panel from x 760 to 1440, 680px wide; the grid stays
    576/864.
  - Header link → focus on Close; Tab stays inside the dialog.
  - Escape → `/` with scrollY 1500 kept, and focus back on the header link.
  - A backdrop click closes; a click inside the panel does not.
  - 390: a full-screen sheet, with a 56×44 Close target.
  - Without JS: the panel shows above the header.

## Review follow-ups

From /review-implementation, agreed with Mark. Applied:

- **A drag from the panel released over the backdrop no longer closes.** The
  browser sends that click to the `<dialog>`, so a `pointerdown` now records
  whether the press started on the backdrop too. Checked in Chrome.
- **The upgrade skips a dialog that is already closed**, e.g. by a Close
  click replayed early. Its queued close event then navigates as usual.
- **`overscroll-behavior: contain` on the dialog**, so scrolling the sheet
  doesn't chain to the page on iOS.
- **The address keeps separators in its DOM text.** Block spans had made it
  read "Mark JungeblutTannenkampstraße 27…" for copy-paste and some screen
  readers. The stricter content test caught this.
- **Spec:**
  - the `showModal` fake throws on an open dialog, as browsers do;
  - the patched prototypes are restored in `afterEach`;
  - navigation is asserted on `router.url`, not a `navigateByUrl` spy;
  - every detail is checked in full, the disclaimer verbatim;
  - new cases for the drag and the early close.

Left as is:

- Leaving with the browser's Back while the dialog is open moves focus to
  `body`, not the header link.
- The Close link scrolls away with the panel if the sheet ever overflows. It
  doesn't at 390×844.
- The shadow's `rgb(0 0 0 / 50%)` is a literal, not a token.
- The spec finds elements with `querySelector`/text rather than by role.
  jsdom computes no accessible names, matching the header spec's approach.
