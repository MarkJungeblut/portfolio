---
created: 2026-10-24
updated: 2026-10-24
---

# Plan: portfolio section

Branch: `feat/portfolio-section`

## Context

Skills is done. The header's Portfolio link and the hero's "See the work" CTA
both target `#portfolio`, which doesn't exist yet. Portfolio is the next
section in page order: a fourth section lib, `libs/features/portfolio`. It
would be the third section to copy the same section shell. The Skills plan
(0007) deferred sharing that shell until Portfolio, and Mark chose to extract
it now as a wrapper component.

From the mockup (`Portfolio Hero.dc.html`, lines 120–163 and `renderVals()`).
Mark confirmed the content is correct:

- **Section:** the same shell as Profile and Skills. Content max-width 820px.
- **Heading:** eyebrow "Portfolio", `h2` "Where I have been building",
  margin-bottom 36px.
- **Rows:** six, newest first. Each has a 1px cream-16% top border, and the
  last one also has a bottom border.
  - Period: 11px, tracking .14em, orange.
  - Role: 21px, weight 300, white.
  - Organisation: 13.5px, weight 300, cream 55%.
  - Layout: narrow stacks the three (gap 4px, padding 18px 0). Wide uses
    `124px minmax(0,1.7fr) minmax(0,1fr)` with gap 20px and padding 22px 0,
    baseline-aligned.

  | Period | Role | Organisation |
  |---|---|---|
  | Since 2026 | Head of Backend Technologies | Lufthansa Industry Solutions |
  | Since 2025 | Solution Architect | Operation Decision Support Suite |
  | 2020 — 2025 | Lead Developer | AVIATAR |
  | 2019 — 2020 | Full Stack Developer | AVIATAR |
  | 2015 — 2019 | Fullstack Developer | Orgadata AG |
  | 2012 — 2015 | Apprenticeship | Orgadata AG |

- **Footnote:** margin-top 26px, baseline flex with a 14px gap.
  "SINCE 2022" is 11px uppercase, tracking .16em, orange. "Volunteer IHK
  examiner" is 14px, weight 300, tracking .08em, cream 50%.

"Full Stack" and "Fullstack" are both in the mockup. They are kept verbatim,
since Mark confirmed the content.

## Decisions (agreed with Mark)

- **Content verbatim from the mockup**, as above.
- **The section shell becomes a `libs/ui` wrapper component**,
  `mj-page-section`. Profile and Skills move onto it in this PR.
- **Rows use a three-step layout**, so they fit the ~472px content column we
  have today at 1440:
  1. Stacked.
  2. Period beside role, with the organisation under the role.
  3. The mockup's three columns once the container is wide enough.

## Approach

### 1. Shared shell: `libs/ui`

`PageSection` (`mj-page-section`) lives in
`libs/ui/src/lib/page-section/page-section.{ts,html,scss}` and is exported
from `libs/ui/src/index.ts`. It is OnPush, with two required signal inputs:

```ts
/** The section's element id: the anchor target, e.g. 'skills'. */
readonly sectionId = input.required<string>();
/** Id of the section's heading, for aria-labelledby. */
readonly headingId = input.required<string>();
```

```html
<section class="section" [id]="sectionId()" tabindex="-1" [attr.aria-labelledby]="headingId()">
  <ng-content />
</section>
```

- Its styles are Profile's and Skills' shell rules, which are identical:
  - column flex, centred;
  - padding `20px 22px 40px`, and wide `16px 48px 96px 56px`;
  - wide `min-height: calc(100svh - var(--header-height))`;
  - `:focus { outline: none }`;
  - `:host { display: block }`.
- The per-section `.content` div with its own max-width (720 / 760 / 820)
  stays in each feature and is projected. The content width and its
  container query belong to the section, not the shell.
- Emulated encapsulation leaves the `<section>` in the light DOM, so
  `getElementById` anchor scrolling, focus and `aria-labelledby` all still
  resolve.

### 2. Profile and Skills refactor

- Each template swaps its `<section …>` for
  `<mj-page-section sectionId="profile" headingId="profile-title">`.
- The `.profile` and `.skills` shell rules leave their stylesheets.
- `PageSection` joins each component's `imports`.
- Nothing should change visually or in the prerendered output, apart from
  the extra `mj-page-section` host element.

### 3. Content: `libs/data`

```ts
/** One role in Mark's career, e.g. "2020 — 2025 · Lead Developer · AVIATAR". */
export interface Position {
  readonly period: string;
  readonly role: string;
  readonly organisation: string;
}

/** A side commitment shown under the positions. */
export interface Engagement {
  readonly period: string;
  readonly label: string;
}

/** Where Mark has worked, newest first. */
export interface PortfolioSectionContent {
  readonly eyebrow: string;
  readonly title: string;
  readonly positions: readonly Position[];
  readonly engagement: Engagement;
}
```

- The content becomes a new `portfolio` member on `PortfolioContent`.
- `PortfolioSectionContent` is re-exported type-only from `index.ts`.
- The name avoids colliding with the `PortfolioContent` service.

### 4. New lib: `libs/features/portfolio`

- Generate it like Skills: non-buildable, `--unitTestRunner=none`, prefix
  `mj`, tag `type:feature`, import path `@portfolio/features/portfolio`.
  The Nx name `features-portfolio` doesn't clash with the app
  `digital-portfolio`.
- Align `project.json` and `tsconfig.spec.json` with Skills, and delete the
  generator boilerplate.
- `PortfolioSection` (`mj-portfolio-section`) lives in
  `src/lib/portfolio-section/…`. It is OnPush and injects `PortfolioContent`.

```html
<mj-page-section sectionId="portfolio" headingId="portfolio-title">
  <div class="content">
    <mj-section-heading [eyebrow]="portfolio.eyebrow" [heading]="portfolio.title" headingId="portfolio-title" />
    <ol class="positions">
      @for (position of portfolio.positions; track position.period + position.role) {
      <li class="position">
        <span class="period">{{ position.period }}</span>
        <h3 class="role">{{ position.role }}</h3>
        <span class="organisation">{{ position.organisation }}</span>
      </li>
      }
    </ol>
    <p class="engagement">
      <span class="period">{{ portfolio.engagement.period }}</span>
      <span class="engagement-label">{{ portfolio.engagement.label }}</span>
    </p>
  </div>
</mj-page-section>
```

- **The positions are an `<ol>`**, since the order (newest first) carries
  meaning. Each role is an `h3`, as with the Skills group labels, so the
  career forms a heading outline under the `h2`.
- **DOM order matches visual order** (period, role, organisation) at every
  step. No grid reordering, so reading order never diverges.

### 5. Styles (mobile first, brand tokens only)

- **Content:** max-width 820px, `container-type: inline-size`. The
  `.positions` list has margin-top 36px, no list style, and
  `role="list"` is **not** added (see out of scope).
- **Row steps** are container queries on `.content`, with local thresholds
  as the CLAUDE.md convention requires:
  1. **Base:** grid, one column, row-gap 4px, padding `18px 0`.
  2. **`$row-split`, about 400px:** columns `124px minmax(0, 1fr)`,
     column-gap 20px, row-gap 4px, padding `22px 0`. The period sits in
     column 1, baseline-aligned with the role. The organisation goes in
     column 2, row 2.
  3. **`$row-full`, about 680px:** the mockup's
     `124px minmax(0, 1.7fr) minmax(0, 1fr)`, all on one baseline row,
     gap 20px. That is roughly what "Head of Backend Technologies" at 21px
     plus "Lufthansa Industry Solutions" need without awkward wrapping.

  Both thresholds will be tuned by measuring at implementation. With today's
  column widths, step 3 is likely only reachable on very wide viewports. It
  starts to matter once section-driven column widths land.
- **Borders:** every row has a `border-top` in `--color-rule`, and the last
  row adds a `border-bottom`.
- **Type and colour:**
  - Period: `--color-orange`, 11px, tracking .14em, weight 400, not
    uppercase. It needs no `white-space: nowrap`, because "2020 — 2025" fits
    the 124px column. To verify.
  - Role: `h3` reset, 21px, weight 300, line-height ~1.3, `--color-cream`.
  - Organisation: 13.5px, weight 300, `--color-text-subtle` (cream 55%,
    matching the mockup).
  - Engagement: the period at 11px uppercase, tracking .16em, orange. The
    label at 14px, weight 300, tracking .08em, `--color-text-subtle`. The
    mockup's 50% is raised to the existing 55% token for contrast, rather
    than reusing `--color-outline` for text.
- Plex Mono becomes Montserrat 400 and Barlow becomes Montserrat 300, as
  elsewhere. There are no new tokens, no new font weights, and no motion.

### 6. App shell

`app.html` gets `<mj-portfolio-section />` after `<mj-skills-section />`, and
`app.ts` imports `PortfolioSection`. With that, the hero's "See the work" CTA
resolves too.

### Alternatives considered

- **Keep copying the shell** (a third local copy). This was the smallest
  diff, but Mark chose to extract now. Three identical copies is the point
  where they start to drift.
- **Sass mixin for the shell.** It shares the styles and leaves the
  `<section>` markup visible in each feature. Mark chose the component,
  which also guarantees `tabindex="-1"` and the `aria-labelledby` wiring.
- **Attribute-selector component on `<section mj-page-section>`.** This
  would keep the real element in the feature's markup, but the
  `@angular-eslint/component-selector` rule requires element selectors, and
  relaxing it for one component isn't worth it.
- **Fold `mj-section-heading` into the shell** (eyebrow and heading inputs,
  heading id derived from the section id). That would be fewer inputs, but
  the heading sits inside the per-section `.content` width, which the shell
  would then have to own or parameterise.
- **Two-step rows** (stacked, then three columns), as in the mockup. At
  today's ~472px content width the three-column step is either unreachable
  or cramped. Mark chose three steps.
- **`<dl>` or a `<table>` for the career.** A table is too heavy for six
  rows with no column headers. A `dl` doesn't fit three values per entry.
  An `ol` of `li`s with an `h3` per role reads cleanly.
- **Positions grouped by organisation** (AVIATAR ×2, Orgadata ×2). This
  would change the content shape the mockup shows. Rejected.

### Tests

None:

- `PageSection` takes inputs and renders a wrapper with no branch.
- `PortfolioSection` renders static content.

Both fall under the presentational exception, as with Skills and
`SectionHeading`.

### Commits

1. `refactor(ui): extract page section shell from profile and skills`
2. `feat(portfolio): add portfolio section` (lib, content, shell wiring)
3. `docs: note portfolio section and page section in claude.md`

## Acceptance criteria

- `/` prerenders `<section id="portfolio">` after `#skills`. It contains:
  - eyebrow "Portfolio";
  - `h2#portfolio-title` reading "Where I have been building", referenced
    by the section's `aria-labelledby`;
  - an `<ol>` of the six positions in the order above, each with its
    period, `h3` role and organisation;
  - the "Since 2022 · Volunteer IHK examiner" footnote.
- The header's Portfolio link and the hero's "See the work" both scroll to
  it with the eyebrow just below the header, and the section takes focus.
- Profile and Skills look unchanged at 390 and 1440. Their prerendered
  `<section>` keeps the same id, `tabindex="-1"` and `aria-labelledby`.
- **Rows at each width:**
  - 390×844: rows stack.
  - Medium container widths, including 1440×900 today: the period sits
    beside the role, with the organisation under it.
  - Above the full threshold: three columns on one baseline.
  - Every row has a top rule, and the last also has a bottom rule.
  - No text overflows at any measured width.
- The page uses `svh` only, never `vh`. The organisation and footnote text
  meet 4.5:1 contrast. There are no mockup hex/rgba values, no Barlow or
  Plex Mono, and no new font imports.
- `features/portfolio` carries `type:feature` and imports only `data` and
  `ui`. Boundaries lint clean.
- `npm run verify` passes.

## Out of scope

- Contact section.
- Scroll-spy, active nav state, section-driven column widths and portrait
  position/tint (the mockup narrows the portrait to 32% on Portfolio).
- Mobile menu and Impressum overlays.
- `role="list"` for `list-style: none` lists in Safari/VoiceOver. This was
  flagged in 0007 and affects Profile, Skills and Portfolio alike, so it
  stays a separate fix.
- Moving Home onto `mj-page-section`: its shell differs (full `svh`, bottom-
  aligned on narrow, `h1`).
- Playwright and visual regression tests.

## CLAUDE.md

- The status becomes "Header, home, profile, skills and portfolio sections
  built".
- Add `portfolio/` to the layout tree, and reduce "remaining section libs"
  to `contact`.
- The section-headings convention line also gets: "a section's `<section>`
  shell (id, focus target, padding, height) comes from `mj-page-section`."

## Verification

1. `npm run verify`.
2. `npm start`. Check `/` at 390×844, 700, 860, 1100, 1440×900 and 1920
   against the mockup, allowing for the brand font and colours:
   - confirm Profile and Skills are unchanged;
   - measure where each row step switches, and tune `$row-split` and
     `$row-full`;
   - contrast-check the organisation text.
3. Click the header's Portfolio link and the hero's "See the work", from
   `/` and from `/impressum`. The page should scroll to Portfolio, and the
   next Tab should start after it.
4. Check `dist/apps/digital-portfolio/browser/index.html` for the portfolio
   markup, the `ol`/`h3`s, and the unchanged ids and `aria-labelledby` on
   all three sections.

## Implementation notes

Deviations found while building, within the approved intent:

- **Thresholds kept as proposed: `$row-split` 400px, `$row-full` 680px.**
  Measured content widths and steps:
  - stacked at 390 (346px), 860 (240px) and 1100 (336px);
  - split at 700 (656px), 1440 (472px) and 1920 (664px);
  - full at 2560 (820px).

  "Head of Backend Technologies" needs about 321px. The three-column role
  track at 664px would be about 315px, so lowering `$row-full` below 1920's
  width would wrap it. Nothing overflows at any measured width.
- **`track position`, not `position.period + position.role`.** Prettier
  split the concatenation over two lines. The content is static, so object
  identity is enough.
- **The engagement's period has its own class, `engagement-period`.** Its
  type differs from a row period (uppercase, tracking .16em), so the two
  don't share `.period`.
- **CLAUDE.md:** the note on the app name no longer calls
  `libs/features/portfolio` "future" or "Selected work". The design's
  eyebrow is "Portfolio".
- **Profile and Skills unchanged.** Screenshots at 390 and 1440 match a
  `main` build in section size and content. Only the column gradient and
  the sticky portrait offset differ, because the page is now taller.

## Review follow-ups

From /review-implementation, agreed with Mark. No code changes:

- **The generated `README.md` is kept** in `libs/features/portfolio`, as in
  the other feature libs. The plan's "delete the generator boilerplate"
  covered the generated component only.
- **`.engagement` also has `flex-wrap: wrap` and `gap: 4px 14px`.** On a
  narrow column the label then drops under the period instead of squeezing
  beside it (visible at 860).
- **Scroll and focus checked in headless Chrome at 1440.** The header link
  on `/`, "See the work", and the header link on `/impressum` all land on
  `/#portfolio`. The section takes focus, and the eyebrow sits 16px below the
  104px header.

Not changed: each row's period precedes its `h3`, so heading navigation
lands on the role after its period. This follows from DOM order matching
visual order, which the plan chose.
