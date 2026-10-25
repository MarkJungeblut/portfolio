---
created: 2026-10-25
updated: 2026-10-25
---

# Fix: hero text covers the face on short phone viewports

## Context

On a real iPhone 16 the home hero's text sits directly over the face in the
portrait. DevTools at 393×852 looks fine, but it emulates the *whole screen*.
On the device, the browser's URL bar and bottom toolbar leave about **660 CSS px**,
and `100svh` resolves to that small viewport.

Mechanism (narrow layout):
- `mj-portrait` (`libs/ui/src/lib/portrait/portrait.scss`) is an absolute
  backdrop `height: 100svh`, photo `object-fit: cover`. The box is taller than
  1.5× its width, so the photo scales with the box height. The face ends at
  about 38 % of the box height.
- `.home` (`libs/features/home/src/lib/home-section/home-section.scss`) is
  `min-height: calc(100svh - var(--header-height))`, `justify-content: flex-end`.
  The text is pinned to the bottom of that box.
- The hero copy (eyebrow → socials, plus padding) is about 515 px tall. At 852 px it
  starts at about 337 px, just under the beard. At 660 px it starts at about 145 px,
  right over the face.

The code matches the mockup (`homeMinH`/`imgHeight: '100svh'`), so the mockup
has the same flaw on short screens. This is not an iOS bug, and DevTools
reproduces it at **393×660**.

Decision (Mark): **height floor**. The hero and portrait never get shorter
than about 850 px on narrow screens. On short phones the face stays clear and the
CTAs/socials sit one short scroll below the fold. Tall phones and the wide layout
are unchanged.

## Approach

1. **Token** in `apps/digital-portfolio/src/styles.scss` `:root`, next to
   `--header-height`:
   ```scss
   // Narrow hero/portrait height: one screen, but never so short that the
   // bottom-aligned hero copy rises over the face (≈515px copy, face ends at
   // ~38% of the photo's height). Wide is one screen.
   --hero-height: max(100svh, 850px);
   ```
   In the existing `@media (min-width: $wide)` block: `--hero-height: 100svh;`.
2. **Portrait** `:host { height: var(--hero-height); }` replaces `100svh`.
3. **Home** `.home { min-height: calc(var(--hero-height) - var(--header-height)); }`.
4. **Portrait `sizes`** (`portrait.html`, both `<source>` and `<img>`): the narrow
   photo now renders at least at ⅔ × 850 ≈ 567 px wide. Change
   `max(100vw, 67vh)` to `max(100vw, 67vh, 567px)` and update the HTML comment so
   short phones don't pick a too-small variant.
5. Tune `850px` visually (step 1 of verification). The exact value may move
   ±30 px so the eyebrow clears the beard as it does today at 852.

`main`'s `min-height: 100svh` stays. Its content now simply grows past it.

### Alternatives considered
- **Compact type on short viewports** (`min-height` media query stepping up to
  today's sizes): keeps one screen, but at 660 px the copy still can't fit
  under the face, so the overlap only shrinks.
- **Stack the photo above the text** (no overlay on narrow): never overlaps,
  but drops the mockup's full-bleed backdrop. A bigger design change.
- **Shift `object-position`/scale the photo**: the face can't move high enough
  in a 660 px box to clear 515 px of copy.
- **Floor only `.home`, leave the portrait at `100svh`**: also clears the face,
  but the photo fades out mid-hero on short phones. A shared token keeps
  photo and hero in step.

## Acceptance criteria
- At 393×660 (and on the iPhone), the hero copy starts below the face.
  Nothing in the eyebrow/title overlaps the eyes, mouth or beard.
- At 393×852 the hero looks as it does today (floor not active, or no visible change).
- Wide layout (≥ 860 px) is unchanged.
- Portrait and hero heights stay in step (photo fade ends where the hero ends).
- `npm run verify` is green.

## Out of scope
- Short *wide* windows (desktop browsers with little height).
- Landscape phones.
- Changing the hero copy, type sizes or the mockup file.
- Other sections (`mj-page-section` is untouched).

## Tests
Pure CSS/markup change, no logic, so no new unit tests (per Test Requirements).
Visual verification below.

## Verification
1. `npm start`, open DevTools responsive mode at 393×660, 393×740, 393×852 and
   430×932. Screenshot each and compare against the acceptance criteria. Tune the
   floor if needed.
2. Check ≥ 860 px wide that nothing changed.
3. `npm run verify`.
4. After deploying the preview, Mark checks on the iPhone.
