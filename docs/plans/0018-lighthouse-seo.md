---
created: 2026-10-25
updated: 2026-10-25
---

# Plan: Fix the Lighthouse SEO and agent-discoverability findings

Branch: `fix/lighthouse-seo`

## Context

A Lighthouse run against https://www.markjungeblut.de reported:

| Category | Finding |
|---|---|
| SEO (83) | Document has no meta description |
| SEO | robots.txt is not valid, 24 errors |
| Agentic Browsing (2/4) | llms.txt does not follow the recommendations |
| Agentic Browsing | ai-catalog.json schema is invalid |
| Performance | Reduce unused JavaScript: `chunk-CBFMSUIV.js`, 93 KiB transferred, about 29 KiB estimated unused |
| Performance | Network dependency tree: document → `main-*.js`, 203 ms critical path |

**Root cause of three of the four red items.** The live site answers every unknown
path with the homepage and status **200**:

```
/robots.txt, /llms.txt, /ai-catalog.json, /sitemap.xml, /does-not-exist
→ 200 text/html, content-disposition: inline; filename="index.html"
```

So Lighthouse parses the homepage HTML as robots.txt (24 "errors" are 24 HTML lines),
as llms.txt and as ai-catalog.json. None of these files exist in
`apps/digital-portfolio/public/` (it has only `favicon.svg` and `images/`). The missing
meta description is separate: `apps/digital-portfolio/src/index.html` has none.

The soft 404 is unexplained. `vercel.json` has no rewrites and sets `framework: null`.
Plan 0014 also put a custom `404.html` out of scope. The `filename="index.html"` header
looks like a catch-all fallback, probably from the Vercel project's dashboard settings,
which this session can't see (the Vercel connector isn't authorised and the CLI isn't
installed).

**Scope decisions you made:** fix the SEO and agent-file findings. Don't publish an
`ai-catalog.json`. Accept the two performance items with no code change. I draft the
meta description and you approve it here.

## Approach

All of these are static files or one `<meta>` tag. Nothing is added to the Angular
code. Everything in `apps/digital-portfolio/public/` is copied as-is to
`dist/apps/digital-portfolio/browser/`, which is Vercel's output directory.

1. **Meta description.** Add this to `apps/digital-portfolio/src/index.html`, right
   after `<title>`:
   ```html
   <meta name="description" content="Mark Jungeblut is a software architect who designs robust, scalable systems end to end, from data model to interface." />
   ```
   It's 119 characters, short enough not to be truncated in results, and taken from the
   hero lede in `libs/data/src/lib/portfolio-content.ts`. `index.html` is the template for
   both prerendered pages, so `/impressum` gets it too. A separate Impressum description
   is out of scope.

2. **`apps/digital-portfolio/public/robots.txt`:** allow everything.
   ```
   User-agent: *
   Allow: /
   ```
   It has no `Sitemap:` line because there is no sitemap (see Out of scope).

3. **`apps/digital-portfolio/public/llms.txt`.** It follows the llmstxt.org structure:
   one `# H1` with the name, a `> blockquote` summary, a short paragraph, then `## H2`
   sections with `- [title](url): note` link lists. All URLs are absolute:
   - `# Mark Jungeblut`
   - `> Software architect…` (the same wording as the meta description)
   - `## Site`: Home `/`, Profile `/#profile`, Skills `/#skills`, Portfolio `/#portfolio`
   - `## Elsewhere`: GitHub, LinkedIn (URLs from `HERO.socials` in `portfolio-content.ts`)
   - `## Optional`: Impressum `/impressum`

   The mail address is left out on purpose, so the file isn't a ready source for
   scrapers. The text is copied by hand from the content lib, so it can drift. A note in
   CLAUDE.md covers that (step 5).

4. **Real 404s: `apps/digital-portfolio/public/404.html`.** A minimal standalone page
   (`<!doctype html>`, `lang="en"`, title, "Page not found", link to `/`) plus
   `<meta name="robots" content="noindex">`. For `framework: null` static output, Vercel
   serves a root `404.html` with status 404 for unmatched paths. This is what makes
   `/ai-catalog.json` (and any other missing file) a real 404, so Lighthouse reports the
   audit as not applicable instead of invalid.
   **This must be checked on the preview deploy.** If unknown paths still return 200
   there, the fallback comes from the Vercel project settings, not the repo. I'll stop
   and ask you to check the dashboard rather than add `vercel.json` routing to work
   around it.

5. **CLAUDE.md:** one workspace-conventions bullet. Crawler files (`robots.txt`,
   `llms.txt`, `404.html`) live in `apps/digital-portfolio/public/`. `llms.txt` and the
   meta description restate content from `@portfolio/data`, so update them when that
   content changes. The performance findings are accepted (reason below), so future
   sessions don't chase them.

### Performance findings: accepted, no change

- `chunk-CBFMSUIV.js` (289 kB raw, 80 kB transferred) is Angular's runtime: core,
  common, router, platform-browser and hydration with event replay. The "unused" 29 KiB
  is framework code that the first paint doesn't run. It is already preloaded with
  `<link rel="modulepreload">`, and `/impressum` is already lazy. The only real savings
  would come from dropping hydration or event replay, or moving off the router. Each of
  those trades away behaviour the site relies on for an unscored estimate.
- The critical chain is document → `main.js`, one hop, with a 4.8 KiB file. It can't
  get shorter while there is a bundle at all. Lighthouse marks both items "Unscored".

### Alternatives considered

1. **Generate robots.txt / llms.txt from `@portfolio/data` at build time** (an Nx
   target or a prerendered route). That keeps them in sync automatically, but it adds
   tooling, or non-HTML routes, to the "two routes" design to produce about 20 lines of
   text. Rejected for now. The CLAUDE.md note covers the drift risk.
2. **Set the meta description per route with Angular's `Meta` service.** That's needed
   only if `/impressum` should have its own description. It adds code and a test for no
   SEO gain, since the Impressum isn't a search landing page. Rejected.
3. **Publish an `ai-catalog.json`.** It's an early draft spec that would need upkeep.
   You chose not to.
4. **Fix the soft 404 with a `vercel.json` route instead of `404.html`.** If the
   fallback is a dashboard setting, a repo-side override only hides it. The cause should
   be removed where it lives. A `404.html` is also the conventional static-host
   mechanism.
5. **Prerender a 404 route in Angular** (a `**` route with a component). That adds a
   third route and a feature for a page with no design. Rejected in favour of a static
   file.

## Acceptance criteria

- `dist/apps/digital-portfolio/browser/` contains `robots.txt`, `llms.txt` and `404.html`
  after `npx nx build digital-portfolio`.
- Both prerendered pages (`index.html`, `impressum/index.html`) contain the meta
  description above.
- `llms.txt` has exactly one H1, a blockquote summary, and H2 sections made only of
  markdown link lists, with absolute URLs.
- Definition of Done is green: `npm run verify`.
- **On the Vercel preview** (you check this, or me with your go-ahead to deploy):
  `/robots.txt` and `/llms.txt` return 200 `text/plain`, and `/ai-catalog.json` and
  `/does-not-exist` return 404. A Lighthouse rerun shows no red items for meta
  description, robots.txt, llms.txt or ai-catalog.json.

## Out of scope

- A `sitemap.xml`, Open Graph or Twitter card tags, structured data (JSON-LD), and a
  `noindex` on `/impressum`. These are worth considering, but Lighthouse didn't flag
  them.
- Any change to the JS bundle, hydration or preloading (the performance items above).
- Designing the 404 page. It is a plain fallback, not part of the mockup.
- The existing budget warning (`site-header.scss` is 200 bytes over its 4 kB budget).
  It's flagged here, not fixed.
- Changing Vercel dashboard settings. That's your call, if the preview check fails.

## Tests

No new unit tests. Every change is a static file or markup, with no logic, which is
the exemption in the test requirements. Verification is the build output check plus
the preview deploy.

## Verification

1. `npx nx build digital-portfolio`, then `ls dist/apps/digital-portfolio/browser`
   and `grep 'name="description"'` both prerendered HTML files.
2. `npx nx serve-static digital-portfolio` (spa: false): `curl -i` `/robots.txt`,
   `/llms.txt`, and an unknown path.
3. `npm run verify`.
4. After the push: `curl -I` the same paths on the preview URL, then run Lighthouse
   again.
