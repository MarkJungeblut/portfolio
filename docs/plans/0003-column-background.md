---
created: 2026-10-20
updated: 2026-10-20
---

# Plan: content column background

Branch: `feat/column-background`

## Context

The header is built, but the page behind it is a flat `#1C1009` body. The mockup
(`docs/mockup/design page - portfolio/Portfolio Hero.dc.html`, lines 42–43 and
`colBg` in `renderVals()`) gives the content column two layers:

1. **Surface (wide only):** `linear-gradient(160deg, #2a211a 0%, #1d1712 60%, #17130f 100%)`.
   On mobile it is `transparent`, so the body colour shows through.
2. **Glow (all widths):** an overlay at `opacity: 0.5` with
   `radial-gradient(120% 80% at 0% 100%, rgba(232,160,92,0.18) 0%, transparent 60%)`,
   a warm orange glow anchored bottom-left of the whole column.

Decided with Mark: **column surface only.** The portrait, the split-screen grid
and the per-section motion come later.

The brand outranks the mockup on colour. It defines a single dark, `#1C1009`,
and orange `#F47A36`, and nothing matches the mockup's three gradient stops. The
stops are therefore **derived from brand tokens** rather than copied as hex.

## Approach

### 1. Tokens: `apps/digital-portfolio/src/styles.scss`
Add two derived tokens next to the existing brand ones:

```scss
// Gradient stops for the content column, derived from the brand dark: the
// brand defines one dark, the mockup's surface needs a lighter and deeper one.
--color-dark-lifted: color-mix(in srgb, var(--color-dark), var(--color-cream) 6%); // ≈ #291e17 (mockup #2a211a)
--color-dark-deep: color-mix(in srgb, var(--color-dark), black 20%);                // ≈ #160d07 (mockup #17130f)
--color-glow: rgb(244 122 54 / 9%); // brand orange; mockup 18% alpha × 0.5 overlay opacity
```

The mockup's middle stop (`#1d1712`) maps to `--color-dark` itself.

### 2. Column background: `apps/digital-portfolio/src/app/app.scss`
`<main>` is the content column (it will hold the sections), so it gets the
background. Mobile first:

```scss
main {
  min-height: 100svh;
  padding-top: var(--header-height);
  background: radial-gradient(120% 80% at 0% 100%, var(--color-glow), transparent 60%);

  @media (min-width: 860px) {
    background:
      radial-gradient(120% 80% at 0% 100%, var(--color-glow), transparent 60%),
      linear-gradient(160deg, var(--color-dark-lifted) 0%, var(--color-dark) 60%, var(--color-dark-deep) 100%);
  }
}
```

- `min-height: 100svh` ensures the surface fills the viewport while `<main>` only
  holds the placeholder `<h1>`. Sections will make it taller anyway. It uses
  `svh`, not `vh`, per CLAUDE.md.
- The glow is one background layer, not a separate overlay element. The
  mockup's `opacity: 0.5` is folded into the colour's alpha.
- The 860px breakpoint is a local `$wide` variable, matching `site-header.scss`.
  This is the second consumer of that breakpoint, so I'll flag it rather than
  extract a shared partial now (see Out of scope).
- Until the grid exists, `<main>` spans the full width on desktop, so the
  gradient runs edge to edge. It narrows to the left column automatically once
  the portrait column lands.

### Alternatives considered
- **Copy the mockup's hex stops.** Rejected because CLAUDE.md says the brand
  outranks the mockup on colour, and those stops come from the superseded palette.
- **Flat `#1C1009`, no gradient.** Rejected because it drops the depth that is
  the point of this increment.
- **Separate overlay `<div>` / `::before` for the glow, like the mockup.**
  Rejected because it needs extra markup or z-index stacking with no gain. A
  layered `background` renders the same.
- **Put the background on `body`.** Rejected because the gradient belongs to the
  content column. On `body` it would sit behind the portrait column later too.
- **Hand-picked hex for the derived stops** instead of `color-mix`. Viable, but
  `color-mix` shows that each stop *is* the brand dark adjusted, and it follows
  any change to the token. Supported in all evergreen browsers (the Angular
  default targets).

### Tests
None. This is pure CSS with no logic, so it falls under the guidelines'
presentational exception.

### Commit
`feat: add content column background`

## Acceptance criteria
- Below 860px, `<main>` shows the body dark with the orange glow bottom-left and
  no linear gradient.
- At or above 860px, `<main>` shows the 160° gradient (lifted → brand dark →
  deep) with the glow on top.
- `<main>` is at least the viewport height (`svh`), and the header sits over
  the background as before.
- Every colour derives from brand tokens. None of the mockup's `#2a211a`,
  `#1d1712`, `#17130f` or `rgba(232,160,92,…)` values appear.
- The breakpoint is a CSS media query only, with no JS.
- `npm run verify` passes.

## Out of scope
- The portrait column, the split-screen grid, image optimisation, and the
  shade/tint overlays.
- Section-driven column widths, photo position and tint (they need scroll-spy).
- Extracting the 860px breakpoint into a shared SCSS partial (this is its second
  use). I'll flag it for a later increment rather than do it here.
- CLAUDE.md changes. No new concept or decision is load-bearing enough.

## Verification
1. `npm run verify`.
2. `npm start`, then view `/` at 390px and 1280px wide. Check that the glow is
   visible bottom-left at both widths, and that the gradient appears only on the
   wide one.
3. Check the prerendered `dist/apps/digital-portfolio/browser/index.html` +
   CSS bundle: no mockup hex values.
