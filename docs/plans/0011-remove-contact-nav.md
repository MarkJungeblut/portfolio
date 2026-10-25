---
created: 2026-10-25
updated: 2026-10-25
---

# Remove Contact from the site header

## Context

The mockup's header nav (and the mobile menu built from it) lists Home,
Profile, Skills, Portfolio, Contact. Mark doesn't want the Contact link
anymore. Only the nav link is going: the Contact *section* stays planned
(CLAUDE.md: "the contact section [is] still to come").

Branch: `feat/remove-contact-nav` (already created).

## Approach

Both the wide-screen nav and the mobile menu in `mj-site-header` loop over
one input, `sections`, which the app shell fills from `content.sections`
(`apps/digital-portfolio/src/app/app.html:2`). That list is the `SECTIONS`
constant in `libs/data/src/lib/portfolio-content.ts:101-107`. The menu's
01–0N numbering comes from the loop index.

1. **`libs/data/src/lib/portfolio-content.ts`**: delete
   `{ id: 'contact', label: 'Contact' }` from `SECTIONS`. Both navs lose the
   link, and the mobile menu numbers its entries 01–04.
2. **`CLAUDE.md`**: add one line saying the header and mobile menu list
   Home, Profile, Skills and Portfolio but not Contact, on purpose (Mark's
   call, not in line with the mockup). That stops a future session from
   "fixing" it back when it builds the Contact section. The Status, Layout
   and Routing passages about the Contact section stay as they are.

Don't touch: the Impressum's "Kontakt" entry (`portfolio-content.ts:91,235`,
the impressum template and its spec). It's legal content, not navigation.

### Alternatives considered

- **Keep `contact` in `SECTIONS` with a `nav: false` flag, filtered in the
  header.** This would keep one list of every page section for future
  scroll-spy. Rejected: nothing reads that list except the header today, and
  a flag that exists only to hide one entry is speculative. When the Contact
  section and scroll-spy are built, they can decide where their ids come from.
- **Filter Contact out inside `mj-site-header`.** Rejected: `libs/ui` is
  presentational and shouldn't know about specific content. The data lib owns
  what the nav shows.
- **Hide it with CSS.** Rejected: the link would still be in the prerendered
  HTML and the accessibility tree.

## Tests

No new tests. This change only edits content data and adds no logic. The
`site-header` spec uses its own fixture (`profile`, `skills`), so it doesn't
depend on the real list and keeps passing.

## Acceptance criteria

- Neither the wide nav nor the mobile menu shows a Contact link, in the dev
  server or in the prerendered `dist/apps/digital-portfolio/browser/index.html`.
- The mobile menu numbers its links 01–04: Home, Profile, Skills, Portfolio.
- The Impressum still shows its Kontakt entry with the mailto link.
- CLAUDE.md records that leaving Contact out of the nav is intentional.
- `npm run verify` passes (build, typecheck, lint, test, format:check).

## Out of scope

- Building the Contact section, and scroll-spy.
- Changing the Impressum, or the Impressum link in the header and menu.
- Editing the mockup or the archived plans in `docs/plans/` that mention the
  Contact link. They're historical records.

## Verification

- `npm run verify`.
- `grep -i contact dist/apps/digital-portfolio/browser/index.html` should
  return no nav link.
- `npm start`, then check the wide header and the mobile menu at narrow
  width.
