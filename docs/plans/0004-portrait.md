---
created: 2026-10-20
updated: 2026-10-20
---

# Plan: portrait column + shared breakpoint

Branch: `feat/portrait`

## Context

The header and the content column background are done. The right half of the
split screen, the portrait, is still missing. It is the page's LCP element and
it defines the two-column grid, so it is the logical next step.

The 860px breakpoint is hard-coded in three places, and each one carries a
"not yet shared" comment: `apps/digital-portfolio/src/styles.scss`,
`apps/digital-portfolio/src/app/app.scss` and
`libs/ui/src/lib/site-header/site-header.scss`. This increment adds a fourth
consumer, so now is the time to extract it.

From the mockup (`Portfolio Hero.dc.html`, lines 25, 196–199 and
`renderVals()`):

- **Wide (≥860px):** grid `1fr minmax(380px, 60%)` (the `home` value). The
  portrait is `position: sticky; top: 0`, full height, with `object-fit: cover`
  and `object-position: 48% 22%`. A horizontal shade sits on top:
  `linear-gradient(90deg, dark .96 → .45 @22% → .08 @55% → .22)`.
- **Narrow:** a single column. The portrait is `position: absolute` at the top
  of the page, `100svh` tall, behind the content (`order: -1`, content
  `z-index: 1`), at `object-position: 50% 18%`, with a vertical shade that fades
  to solid dark at the bottom.
- `filter: grayscale(1) contrast(1.06) brightness(0.92)` on the photo.
- The source photo is `docs/mockup/design page - portfolio/uploads/20260704-DSC03277.jpg`,
  4672×7008 and 8 MB.

## Approach

### 1. Shared breakpoint: `libs/ui/src/styles/_breakpoints.scss`

```scss
// The one layout breakpoint: narrow below, split screen from here up.
// Mobile first, so use it only as `@media (min-width: $wide)`.
$wide: 860px;
```

- Add `"stylePreprocessorOptions": { "includePaths": ["libs/ui/src/styles"] }`
  to the app's `build` options. Libs are non-buildable and compile through the
  app build. The unit-test builder spreads the build target's options, so lib
  specs resolve it too (checked in `@angular/build/.../unit-test/builder.js`).
- Each consumer replaces its local `$wide` and comment with
  `@use 'breakpoints' as *;`. That covers `styles.scss` (whose literal
  `860px` becomes `$wide`), `app.scss`, `site-header.scss` and the new portrait.
- The file lives in `libs/ui` because the breakpoint is presentational. app →
  ui and feature → ui are both allowed edges, so every future consumer can
  reach it.

### 2. Image variants: generated once, only the outputs committed

- No new dependency and no script in the repo, because the photo rarely
  changes. A throwaway `npx sharp-cli` run in the scratchpad reads the source
  JPEG and writes
  `apps/digital-portfolio/public/images/portrait-{640,960,1280,1600,2000}.{avif,webp}`.
- At implementation I'll record the exact command in this plan, so the archived
  plan is the recipe for regenerating the images.
- The run also bakes in the mockup's grayscale, contrast and brightness. The CSS
  filter goes away, the files get smaller, and the browser does no filter work
  on a full-screen layer.
- It strips EXIF, so no camera or GPS metadata gets published.
- It keeps the full frame with no crop, because later sections will shift
  `object-position` and need the room.
- Widths: the largest render is a 3× phone at 100svh, where height-limited
  `cover` gives about 1700px wide. 2000 is the ceiling.
- Only the generated files are committed, so the build stays Node-only and
  needs no native dependency.

Recipe as run, from the repo root, sharp-cli 5.3.0. The `linear` values fold
CSS `contrast(1.06)` (offset `128 × (1 − 1.06)`) followed by `brightness(0.92)`
into a single `a·x + b`: `0.92 × 1.06 = 0.9752`, `0.92 × −7.68 = −7.0656`.
sharp drops EXIF by default.

```sh
OUT=apps/digital-portfolio/public/images
SRC="docs/mockup/design page - portfolio/uploads/20260704-DSC03277.jpg"
for w in 640 960 1280 1600 2000; do
  npx -y sharp-cli@5 --autoOrient -i "$SRC" -o $OUT/portrait-$w.avif -f avif -q 50 --effort 6 resize $w -- grayscale -- linear 0.9752 --offset -7.0656
  npx -y sharp-cli@5 --autoOrient -i "$SRC" -o $OUT/portrait-$w.webp -f webp -q 72 --effort 6 resize $w -- grayscale -- linear 0.9752 --offset -7.0656
done
```

Result: 9–59 KB AVIF and 14–121 KB WebP. That totals about 450 KB on disk,
and a browser fetches only one file.

### 3. `Portrait` component in `libs/ui` (`mj-portrait`)

Presentational. Markup:

```html
<picture>
  <source type="image/avif" [srcset]="…avif widths" [sizes]="sizes" />
  <img src="/images/portrait-1280.webp" srcset="…webp widths" [sizes]="sizes"
       [alt]="alt()" width="4672" height="7008"
       fetchpriority="high" decoding="async" />
</picture>
<div class="shade" aria-hidden="true"></div>
```

- `alt` is a required input. The text comes from the data lib
  (`PortfolioContent.portrait.alt = 'Portrait of Mark Jungeblut'`), because
  content lives there.
- `sizes="(min-width: 860px) 60vw, 67vh"`. The narrow value is height-driven
  because the image is `cover` in a tall box. `sizes` cannot read SCSS, so I
  write 860 once more here, with a comment pointing to `_breakpoints.scss`.
- It is eager, not lazy, because this is the LCP image.
- SCSS, mobile first: the absolute full-width `100svh` box and the vertical
  shade by default. `@media (min-width: $wide)` switches to `sticky; top: 0;
  height: 100svh` and the horizontal shade. Shade colours derive from
  `--color-dark` with `color-mix`, never the mockup's `rgba(23,19,15,…)`, as in
  the column background increment.

### 4. App shell

- `app.html`: `<mj-portrait [alt]="content.portrait.alt" />` after `<main>`.
- `app.scss`: `:host { display: block; position: relative; }`. Narrow: `main`
  gets `position: relative; z-index: 1` so it paints over the absolute
  portrait. Wide: `:host { display: grid; grid-template-columns: 1fr minmax(380px, 60%); }`.
  The header is fixed and the host of `SiteHeader` is `display: contents`, so it
  takes no grid cell.
- `main`'s gradient now naturally covers only the left column.

### Alternatives considered

- **Breakpoint as a CSS custom property.** This doesn't work, because custom
  properties are not allowed in media queries. `@custom-media` has no browser
  support and Angular's build does not lower it.
- **Breakpoint partial in `libs/utils`, or relative `@use '../../..'` paths.**
  utils is meant to be framework-agnostic TS, not styling. Relative paths break
  on every move. An include path on `libs/ui` is the cleanest.
- **Build-time image pipeline (vite-imagetools, etc.).** The application builder
  uses esbuild for builds and does not run Vite plugins, so this isn't possible
  without a custom builder, which CLAUDE.md forbids.
- **`NgOptimizedImage`.** Its srcset generation needs an image CDN loader, and
  this is a static host with no CDN. It also does not handle `<picture>` with
  multiple formats. A hand-written `<picture>` is simpler here.
- **Generation script plus `sharp` as a devDependency.** Reproducible from the
  repo, but it adds a native dependency and a tool for a photo that rarely
  changes. Mark chose the one-off run, with the command recorded here instead.
- **Manual export (Squoosh / Photoshop).** Not reproducible. A recorded
  command documents exactly how the assets were made.
- **Keep the CSS `filter` instead of baking it in.** That would make it
  tweakable without regenerating, but the cost is bigger files and a filter on
  a full-viewport layer.
- **AVIF only, or WebP only.** AVIF is about 30% smaller, and WebP is a cheap,
  safe fallback. JPEG is not needed for evergreen browsers.

### Tests

None. The `Portrait` component takes one input and renders markup, with no
branch, derived state or handler. It falls under the presentational exception.
The image variants are checked by their file sizes and the visual verification
below.

### Commits

1. `refactor: share the wide breakpoint via a sass partial`
2. `feat: add optimised portrait images` (generated files only)
3. `feat(ui): add portrait column`

## Acceptance criteria

- `860px` is defined once in SCSS (`_breakpoints.scss`). The only other
  occurrence is the `sizes` attribute, which carries a comment pointing to the
  partial.
- No "not yet shared" comments remain.
- At ≥860px there are two columns: content on the left and the portrait on the
  right at `minmax(380px, 60%)`. The portrait stays pinned (sticky, `100svh`)
  while `main` scrolls.
- Below 860px the portrait fills the top `100svh` behind the content and fades
  to the page dark at the bottom. Text stays readable over it.
- The photo renders grayscale. No asset over about 400 KB ships to the page.
  The 8 MB original is never copied into `public/` or `dist/`.
- The image has meaningful `alt` text from the data lib and `fetchpriority="high"`.
- No mockup hex or `rgba(23,19,15,…)` values. Shades derive from brand tokens.
- No JS breakpoints. The prerendered HTML is correct before hydration.
- `npm run verify` passes.

## Out of scope

- Section-driven column widths, `object-position` changes and the tint overlay.
  All three need scroll-spy.
- Motion on the portrait. Nothing animates yet, so there is nothing to gate
  behind `prefers-reduced-motion`.
- Hero text, sections, the mobile menu and the Impressum overlay.
- Moving the source photo out of `docs/mockup/`.
- Repo tooling for image generation (a script or `sharp` dependency).
- CLAUDE.md: I'll add one line under Workspace conventions about the
  `breakpoints` include path, because it is non-obvious and load-bearing.
  Nothing else changes.

## Review follow-ups

These come from /review-implementation and were applied with Mark's approval:

- **`sizes` is now `(min-width: 860px) max(60vw, 67vh), max(100vw, 67vh)`.**
  The photo is `cover` in a `100svh` box, so its rendered width is the larger
  of the box's width and ⅔ of the viewport height. The old `67vh` / `60vw`
  under-requested on landscape phones and tall tablets, where the image came
  out soft.
- **The wide state resets `inset: 0 auto auto`,** so the narrow layout's
  `left`/`right: 0` doesn't carry into sticky.
- **Dropped `decoding="async"`** on the LCP image, since it can delay the
  first paint.
- **Portrait outside a landmark.** The photo keeps its alt text. Mark had the
  placeholder `<h1>Mark Jungeblut</h1>` removed from `app.html` instead. The
  real heading arrives with the hero section, so until then the page has no
  `<h1>`.

## Verification

1. Check the file sizes in `apps/digital-portfolio/public/images/` and that
   the files carry no EXIF data.
2. `npm run verify`.
3. `npm start`, then check `/` at 390×844 and 1440×900. At 390, the portrait is
   behind the content, fades out, and the header is over it. At 1440, it is
   split 40/60, the portrait is sticky while scrolling, and the shade blends
   into the column. In DevTools Network, confirm that an AVIF variant loads
   with the expected width.
4. Check the prerendered `dist/apps/digital-portfolio/browser/index.html` for
   the `<picture>` markup, and the CSS for no mockup colour values.
