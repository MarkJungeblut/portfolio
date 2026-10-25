---
created: 2026-10-25
updated: 2026-10-25
---

# Fix: Impressum close button position, brand favicon, tab title

## Context

1. **Close button sits above the cursor (wide screens).** The header's
   Impressum link is in a 44px row under `padding: 30px 56px`
   (`libs/ui/src/lib/site-header/site-header.scss:39`), so its centre is
   **52px** from the top and its right edge is **56px** from the viewport's
   right edge. The dialog's `.close` is `top: 12px; right: 30px` with a 44px
   min-height (`libs/features/impressum/src/lib/impressum-page/impressum-page.scss:57-79`),
   so its centre is at **34px**. That's 18px higher, and it's also 26px
   further right. The mockup has the same offset (`top: 26px; right: 30px`), so
   this fixes something the prototype also got wrong.
2. **Favicon is still the scaffold default.** `apps/digital-portfolio/public/favicon.ico`
   dates from `chore: scaffold nx workspace` and is the Nx/Angular icon. It
   gets replaced with the MARK signature (Primary), as you chose: a copy just
   for the favicon, cropped to a square and drawn with a heavier stroke.

## Approach

### 1. Close button (`impressum-page.scss`)
In the existing `@media (min-width: $wide)` block of `.close`, set
`top: 30px; right: 56px`, the header's wide padding. The 44px box then lines
up with the header row: same centre line, and the same right edge as the
Impressum link. Clicking Impressum leaves the cursor over "Close ×". The
narrow layout doesn't change: there, the trigger is the Menu sheet's footer
link, so there's no on-screen position to match.

A short comment notes that the values mirror the header padding on purpose.

### 2. Favicon
- Add `apps/digital-portfolio/public/favicon.svg`. It reuses the path and
  `#F47A36` from `docs/design/svg/MARK_Signature_Logos/MARK_Signature_Primary.svg`,
  with a square viewBox centred on the stroke (about `122 163 330 330`) and
  `stroke-width` around 18 so the line still reads at 16px. Keep the
  `<title>`; drop `role` and `aria-labelledby`, since a favicon doesn't need them.
- In `apps/digital-portfolio/src/index.html`, change the link to
  `<link rel="icon" type="image/svg+xml" href="favicon.svg" />`.
- Delete `favicon.ico`. Keeping it as a fallback would show the Nx logo.

### 3. Tab title
In `apps/digital-portfolio/src/index.html`, change `<title>digital-portfolio</title>`
to `<title>Mark Jungeblut</title>`. No route sets its own `title`, so both
prerendered pages (`/` and `/impressum`) get it.

## Alternatives considered

- **Centre only vertically (`top: 30px`, keep `right: 30px`).** That's the
  smallest change and fixes what you reported. But the cursor would still land
  left of the label, not on it, so the click-without-moving case would only
  half work. Rejected.
- **Measure the trigger link's position in JS and place the button there.**
  It would always be exact, but it breaks the "breakpoints and layout are CSS"
  rule, it doesn't work on the prerendered page, and a shared token is
  enough. Rejected.
- **Share the header padding as a Sass variable in `libs/ui`.** Cleaner than
  two matching literals, but it adds a new shared style partial for one
  value. Flagged as a possible follow-up, not done here.
- **Favicon:** use the Primary SVG unchanged (too faint at 16–32px), or the
  Icon variant. You chose the thicker Primary copy.
- **Also generate PNG/ICO/apple-touch-icon variants.** Out of scope; see below.

## Acceptance criteria

- At widths ≥ `$wide`, the centre of the Impressum close link lines up
  vertically with the header's Impressum link (52px from the top), and its
  right edge is 56px from the viewport's right edge.
- The narrow layout of the close link is unchanged.
- The browser tab shows the orange MARK signature. The `<head>` has no
  reference to `favicon.ico` and the file is gone.
- The prerendered `dist/apps/digital-portfolio/browser/` has `favicon.svg`,
  and both pages link to it.
- On both pages, the browser tab reads "Mark Jungeblut".
- `npm run verify` passes.

## Out of scope

- PNG/ICO fallbacks, `apple-touch-icon` and a web manifest. Older Safari
  shows no favicon without them; flagged as a follow-up.
- A separate title for `/impressum` (e.g. "Impressum · Mark Jungeblut").
  Flagged as a possible follow-up.
- Changing the close label or glyph.

## Tests

CSS and static assets only, with no new logic, so no new specs (per Test
Requirements). The existing Impressum specs must still pass.

## Verification

1. `npm run verify` (build, typecheck, lint, test, format check).
2. `npm start`. At a wide viewport, click Impressum without moving the mouse:
   the cursor should be over "Close ×". Check this in devtools by comparing the
   bounding boxes of the two elements. Check the narrow layout is unchanged.
3. Check the tab icon in the browser, and that `favicon.svg` is in the build
   output.
