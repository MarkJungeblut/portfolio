# Mark Jungeblut — Portfolio

Personal portfolio site: a single split-screen page (content on the left,
portrait on the right) plus an Impressum. Both pages are prerendered to static
HTML at build time.

Built with Angular 22 in an Nx 23 workspace.

## Getting started

Requires Node `^24.15` and npm. Alternatively, open the repo in the
devcontainer in `.devcontainer/`.

```sh
npm ci
npx nx serve digital-portfolio
```

Then open http://localhost:4200.

## Commands

| Task        | Command                                              |
| ----------- | ---------------------------------------------------- |
| Install     | `npm ci`                                             |
| Dev server  | `npx nx serve digital-portfolio`                     |
| Build       | `npx nx run-many -t build`                           |
| Test        | `npx nx run-many -t test`                            |
| Single test | `npx nx test <project> --filter=<pattern>`           |
| Typecheck   | `npx nx run-many -t typecheck`                       |
| Lint        | `npx nx run-many -t lint`                            |
| Format      | `npx nx format:write` (check: `npx nx format:check`) |

The static site is written to `dist/apps/digital-portfolio/browser`.

## Workspace

```
apps/digital-portfolio   the app shell
libs/features/*          one library per page section, plus the Impressum
libs/data                portfolio content and its types
libs/ui                  presentational components
libs/utils               framework-agnostic helpers
```

Which library may import which is enforced by lint. The rules, the stack and
the design constraints are in [`CLAUDE.md`](CLAUDE.md).

## Contributing

Work follows [`docs/guidelines/`](docs/guidelines/): branch per change,
Conventional Commits, PRs into a protected `main`. With Claude Code, `/plan`
runs the plan → implement → `/review-implementation` workflow.

## License

[MIT](LICENSE)
