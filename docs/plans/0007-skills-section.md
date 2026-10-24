---
created: 2026-10-24
updated: 2026-10-24
---

# Plan: skills section

Branch: `feat/skills-section`

## Context

Profile is done. The header's Skills link targets `#skills`, which doesn't
exist yet. Skills is the next section in page order. It is a third section
lib, `libs/features/skills`, and the second section with the ruled eyebrow and
`h2`. The profile plan (0006) deferred sharing those until a second consumer
showed up. Skills is that consumer, so the extraction happens in this
increment too.

From the mockup (`Portfolio Hero.dc.html`, lines 93–118 and `renderVals()`):

- **Section:** same shell as Profile: column flex, centred. Narrow
  `min-height: auto`, padding `88px 22px 40px`. Wide `100vh`,
  `120px 48px 96px 56px`.
- **Content** (max-width 760px): eyebrow "Skills" (identical to Profile's),
  `h2` 27/38px weight 200, line-height 1.2, margin-bottom 40px.
- **Groups:** grid, 1 column narrow / 2 equal columns wide, gap `34px 48px`.
  Each group: 1px cream-16% top border, padding-top 16px, column flex gap
  12px. Label 10.5px uppercase, tracking .2em, orange. Items 15.5px,
  line-height 1.7, weight 300, cream 70%, separated by " · ".

## Decisions (agreed with Mark)

- **Content verbatim from the mockup.** The heading is "The stack I reach for,
  and the parts I get called in to fix.", followed by four groups:
  - Architecture: Architectural Transformation · Domain Driven Design · Event
    Driven Design · Micro Service Architecture
  - Backend: C# · ASP.NET · Kotlin · Spring Boot · REST · gRPC · SQL · Pub/Sub
  - Frontend: TypeScript · Angular · React · Web Components · Module Federation
  - Platform: Google Cloud Platform · Azure · GitHub · Kubernetes · Prometheus ·
    OpenTelemetry
- **The shared eyebrow + `h2` become a `libs/ui` component** (`mj-section-heading`),
  and Profile is refactored onto it in the same PR.

## Approach

### 1. Shared heading: `libs/ui`

`SectionHeading` (`mj-section-heading`) in
`libs/ui/src/lib/section-heading/section-heading.{ts,html,scss}`, exported
from `libs/ui/src/index.ts`. OnPush, three required signal inputs:

```ts
readonly eyebrow = input.required<string>();
readonly title = input.required<string>();
readonly headingId = input.required<string>(); // for the section's aria-labelledby
```

```html
<p class="eyebrow">{{ eyebrow() }}</p>
<h2 class="title" [id]="headingId()">{{ title() }}</h2>
```

- The styles move over verbatim from `profile-section.scss`: the eyebrow with
  its `::before` rule, the title at 27/38px. `:host { display: block }`.
- No bottom margin on the title. Each section spaces what follows it:
  Profile's lede already has `margin-top: 24px`, and Skills' grid gets 40px.
- Emulated encapsulation leaves the `h2` in the light DOM, so
  `aria-labelledby="…-title"` on the section still resolves.

### 2. Profile refactor

`profile-section.html` replaces its eyebrow `<p>` and `h2` with
`<mj-section-heading [eyebrow]="profile.eyebrow" [title]="profile.title" headingId="profile-title" />`
and imports `SectionHeading` from `@portfolio/ui` (feature → ui is allowed).
The `.eyebrow` and `.title` rules leave `profile-section.scss`. Profile's local
`label` mixin stays because the stat labels still use it. Nothing should
change visually.

### 3. Content: `libs/data`

Add a `skills` member to `PortfolioContent`:

```ts
/** A named group of skills, e.g. "Backend". */
export interface SkillGroup { readonly label: string; readonly items: readonly string[] }

/** What Mark works with, in four groups. */
export interface SkillsContent {
  readonly eyebrow: string;   // 'Skills'
  readonly title: string;
  readonly groups: readonly SkillGroup[];
}
```

Re-export `SkillsContent` type-only from `libs/data/src/index.ts`, as with
`ProfileContent`.

### 4. New lib: `libs/features/skills`

- Generate it with the same flags as profile: non-buildable,
  `--unitTestRunner=none`, prefix `mj`, tag `type:feature`, import path
  `@portfolio/features/skills`. Align `project.json` and `tsconfig.spec.json`
  with profile's, and delete the generator boilerplate.
- `SkillsSection` (`mj-skills-section`) in
  `src/lib/skills-section/skills-section.{ts,html,scss}`, OnPush, injects
  `PortfolioContent`:

```html
<section class="skills" id="skills" tabindex="-1" aria-labelledby="skills-title">
  <div class="content">
    <mj-section-heading [eyebrow]="skills.eyebrow" [title]="skills.title" headingId="skills-title" />
    <ul class="groups">
      @for (group of skills.groups; track group.label) {
      <li class="group">
        <h3 class="group-label">{{ group.label }}</h3>
        <ul class="items">
          @for (item of group.items; track item) { <li class="item">{{ item }}</li> }
        </ul>
      </li>
      }
    </ul>
  </div>
</section>
```

- **Items are a real list shown inline.** The " · " is a
  `.item + .item::before { content: '·' / '' }` pseudo-element. The empty
  alt text keeps screen readers from announcing it. Items wrap as flowing
  text, as in the mockup.

### 5. Styles (mobile first, brand tokens only)

- **Section shell:** the same as Profile's, with top padding reduced by the
  header height (20px narrow, 16px wide), wide
  `min-height: calc(100svh - var(--header-height))`, and
  `:focus { outline: none }`. Each section keeps its own copy for now (see
  alternatives).
- **Group grid:** one column, and two from a container query on `.content`
  (`container-type: inline-size`), as with Profile's stat grid. The wide
  content column is still a fixed 40% of the viewport, so `$wide` alone would
  squeeze two columns into ~376px at 860. Proposed threshold: 520px of
  content width, tuned by measuring at implementation. Gap `34px 48px`,
  margin-top 40px.
- **Colours:** group top border is a new token, `--color-rule` (cream 16%),
  next to `--color-hairline`. Labels are `--color-orange`. Items use
  `--color-text-muted` (cream 66%, which the mockup's 70% rounds to, so no
  extra token).
- Group labels are uppercase Montserrat 400 instead of Plex Mono, as
  elsewhere. No new font weights. The `h3` is reset to label size and weight.
- No motion, no interactive elements.

### 6. App shell

`app.html` gets `<mj-skills-section />` after `<mj-profile-section />`, and
`app.ts` imports `SkillsSection`.

### Alternatives considered

- **Sass partial instead of a component** (`libs/ui/src/styles/_section.scss`
  mixins). This would share the styles only, leave markup and ids local, and
  need no input API. Mark chose the component, which also shares the markup
  structure (eyebrow `<p>` then `h2`), so Portfolio and Contact can't drift.
- **Title via content projection** (`<mj-section-heading>…</mj-section-heading>`)
  instead of a `title` input. That allows rich text in headings, but none of
  the sections need it. An input keeps the call site to one line and the
  type strict.
- **Fold the section shell (padding, min-height, focus) into the shared
  piece too**, either as a wrapper component or a mixin. Rejected for now:
  the shell holds the `<section>` element with its id, tabindex and
  `aria-labelledby`, and wrapping it hides those from the feature. That's
  about 15 lines repeated twice. Revisit with Portfolio.
- **Items as one joined string** (`items.join(' · ')`), like the mockup's
  single paragraph. Simpler, but a screen reader reads it as one run of
  text with "dot" between items. A list states how many there are.
- **Group label as `<p>` instead of `h3`.** The `h3` gives the section a
  heading outline under its `h2`, and a group is a sub-topic.
- **`$wide` media query for the 2-column grid.** That would break the
  CLAUDE.md container-query convention for a layout that depends on the
  component's own width.

### Tests

None. `SectionHeading` takes inputs and renders markup, and `SkillsSection`
renders static content. Neither has a branch, derived state or handler, so
both fall under the presentational exception.

### Commits

1. `refactor(ui): extract section heading from profile`
2. `feat(skills): add skills section` (lib, content, token, shell wiring)
3. `docs: note skills section and section heading in claude.md`

## Acceptance criteria

- `/` prerenders `<section id="skills">` after `#profile`, with eyebrow
  "Skills", an `h2` with the agreed heading, and four groups in order
  (Architecture, Backend, Frontend, Platform), each an `h3` plus a list of its
  items exactly as listed above.
- The header's Skills link scrolls to it with the eyebrow just below the
  header, and the section takes focus.
- Profile looks unchanged after the refactor (compare at 390 and 1440) and
  still has an `h2#profile-title` referenced by its `aria-labelledby`.
- Narrow (390×844): groups stack. At 1440×900 they form two columns with a
  top rule each, and content sits centred in a section one visible-viewport
  tall. No group overflows at any measured width.
- Screen readers do not announce the " · " separators.
- The page uses `svh` only, never `vh`. Item text meets 4.5:1 contrast.
  There are no mockup hex/rgba values, no Barlow or Plex Mono, and no new
  font imports.
- `features/skills` carries `type:feature` and imports only `data` and `ui`.
  Boundaries lint clean.
- `npm run verify` passes.

## Out of scope

- Portfolio and Contact sections.
- Scroll-spy, active nav state, section-driven column widths and portrait
  position/tint (the mockup narrows the portrait to 36% on Skills).
- Mobile menu and Impressum overlays.
- Sharing the section shell or the `label` mixin (see alternatives).
- Moving home's eyebrow onto `mj-section-heading`: it has no rule and an
  `h1`, so it is a different element.
- Playwright and visual regression tests.

## CLAUDE.md

- Status becomes "Header, home, profile and skills sections built". Add
  `skills/` to the layout tree, and drop `skills` from the "remaining section
  libs" sentence.
- One convention line: section eyebrow + `h2` come from `mj-section-heading`
  in `@portfolio/ui`, never re-built per section.

## Verification

1. `npm run verify`.
2. `npm start`. Check `/` at 390×844, 860, 1100 and 1440×900 against the
   mockup, allowing for brand font and colours. Confirm Profile is
   unchanged, measure where the group grid switches, and contrast-check an
   item.
3. Click the header's Skills link from `/` and from `/impressum`. The page
   should scroll to Skills, and the next Tab should start after it.
4. Check `dist/apps/digital-portfolio/browser/index.html` for the skills
   markup, the `h2`/`h3`s, and `profile-title` still on Profile's `h2`.

## Implementation notes

Deviations found while building, within the approved intent:

- **Group grid threshold is 440px, not the proposed 520px.** The wide content
  column still follows Home's 60% portrait, so content is only 472px at 1440
  (not ~760px as assumed), and 520px would have left 1440 single-column,
  failing the acceptance criterion. Measured with 440px: one column at 390,
  860, 1100 and 1200 (content 240–376px), two at 700 (narrow layout), 1440
  and 1920. No group or stat tile overflows at any measured width.
- **Separator is `'\a0· '`, not `' · '`.** With a plain space before the dot,
  a wrapped line could start with "· Web Components" at 1440. The no-break
  space keeps the dot with the previous item, so lines end with " ·" instead.

## Review follow-ups

From /review-implementation, applied with Mark's approval:

- **Separator fallback.** A plain `content: '\a0· '` now precedes the
  alt-text declaration. Where `content: x / ''` is unsupported the whole
  declaration is dropped, and items would otherwise run together.
- **`SectionHeading`'s `title` input is renamed to `heading`.** `title`
  shadows the global HTML attribute, so a future static `title="…"` would
  also add a native tooltip over the heading.

Not changed: `list-style: none` lists lose list semantics in Safari/VoiceOver
without `role="list"`. That affects the skills lists and Profile's existing
stat list alike, so it is left for a separate fix. The stock generated
`README.md` is kept, as in the other feature libs.
