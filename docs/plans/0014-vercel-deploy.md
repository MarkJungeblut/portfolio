---
created: 2026-10-25
updated: 2026-10-25
---

# Plan: Deploy the prerendered site on Vercel

Branch: `chore/vercel-deploy`

## Context

The site is deployed to Vercel, but the page comes back as "404: NOT_FOUND". The repo has
no Vercel configuration (no `vercel.json`, no `.vercel/`), so Vercel falls back to
guessing from `package.json`:

- **Output directory mismatch (the likely cause).** The build writes the static site to
  `dist/apps/digital-portfolio/browser/` (`apps/digital-portfolio/project.json`,
  `outputMode: "static"`). Vercel's defaults look in `dist/`, `public/` or, with the
  Angular preset, `dist/<package-name>/browser`. None of those has an `index.html`, so
  every request 404s.
- **Framework detection.** `@angular/ssr` is in the dependencies, so the Angular preset
  may treat this as an SSR app. It isn't one: there is no server bundle, and CLAUDE.md
  says none should be added.
- **Build command.** `npm run build` builds every project. That's harmless, but it isn't
  the one artefact being deployed.

The two prerendered routes already have the layout Vercel's static hosting expects:
`browser/index.html` for `/` and `browser/impressum/index.html` for `/impressum`.
Vercel serves a directory's `index.html` for `/impressum` with no rewrites, so no
routing config is needed.

I can't see your Vercel project's settings: the Vercel connector isn't authorised in this
session, and the repo isn't linked. The diagnosis above comes from the repo alone.

## Approach

Add one file, `vercel.json` at the repo root, so the deploy settings live in git and
override whatever the dashboard guessed:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": null,
  "installCommand": "npm ci",
  "buildCommand": "npx nx build digital-portfolio",
  "outputDirectory": "dist/apps/digital-portfolio/browser"
}
```

- `framework: null` means plain static hosting: no Angular/SSR adapter and no function.
- `buildCommand` builds only the app, in its default `production` configuration.
- `outputDirectory` points at the prerendered HTML.
- Node: Vercel reads `engines.node` (`^24.15.0`) from `package.json`, so Node 24 is
  already selected. Nothing to add.

Add a **Hosting** row to the CLAUDE.md stack table: "Vercel, static output only, configured
in `vercel.json`". This is a stack decision, so it's load-bearing for future sessions.

### Alternatives considered

1. **Set the build and output settings in the Vercel dashboard only.** It fixes the
   deploy, but the config isn't versioned, isn't reviewable, and is lost if the project
   is re-imported. Rejected; `vercel.json` wins over the dashboard anyway.
2. **Keep Vercel's Angular preset and only override `outputDirectory`.** It's less
   explicit, and the preset's SSR detection could still set up a server function for an
   app that has no server bundle. Rejected.
3. **Move the build output to the path Vercel expects** (e.g. `dist/digital-portfolio`).
   That changes the Nx convention and the `serve-static` target to suit one host.
   Rejected; the host config should adapt to the build, not the other way round.
4. **Build in GitHub Actions and deploy with `vercel deploy --prebuilt`.** This needs
   tokens and secrets and changes CI. It's overkill for a static site Vercel can build
   itself. Rejected for now.

## Acceptance criteria

- `vercel.json` exists at the repo root with the settings above, and passes Prettier.
- `npx nx build digital-portfolio` produces `dist/apps/digital-portfolio/browser/index.html`
  and `.../impressum/index.html`, at exactly the configured `outputDirectory`.
- The CLAUDE.md stack table has the Hosting row.
- Definition of Done is green: `npm run verify`.
- After a redeploy from this branch, Vercel returns 200 for both `/` and `/impressum`.
  Only you can check this, from the preview deployment.

## Out of scope

- A custom `404.html`, security or caching headers, a redirect for the `/impressum/`
  trailing slash, or a custom domain.
- Deploying from CI (alternative 4), and adding Playwright smoke tests against the
  deployment.
- Changing any Vercel dashboard settings. You do that, if it turns out to be needed. For
  example, the project's **Root Directory** must be the repo root, which is the default.

## Verification

1. `npx nx build digital-portfolio`, then confirm both `index.html` files are in the
   configured output dir.
2. `npx nx format:check` covers `vercel.json`, then the full `npm run verify`.
3. No unit tests: this is pure configuration, with no logic to test.
4. You open the Vercel preview deployment for this branch and load `/` and `/impressum`.
