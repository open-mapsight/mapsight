# Contributing

How to propose changes to the Mapsight monorepo.

---

## Before you start

1. Read [Licensing](../LICENSING.md) — **MIT** for the public tree.
2. Read [Trademark policy](../TRADEMARK.md) — code license does not grant use of the **Mapsight** name or logo.
3. Read [Standards](STANDARDS.md) — toolchain, checks, testing expectations.
4. For map runtime changes, skim [Redux architecture](../../packages/core/docs/REDUX_ARCHITECTURE.md)
   and [Action guide](../../packages/core/docs/ACTION_GUIDE.md).

Contributions to the **public tree** are accepted under **MIT**. See
[Decision 011](../architecture/decisions/011-license-and-brand-strategy.md).

---

## Development setup

```bash
git clone https://github.com/open-mapsight/mapsight.git
cd mapsight
pnpm install
pnpm typecheck
pnpm test
pnpm run check
```

Use Node and pnpm versions from root `package.json` `engines`.

---

## Pull request workflow

1. Branch from the current default integration branch (maintainers use public and private branch variants — follow team
   guidance).
2. Keep diffs focused; match surrounding style.
3. Run locally before push:
    - `pnpm typecheck`
    - `pnpm lint`
    - `pnpm test` (or affected packages via turbo filters)
    - `pnpm run check`
4. Open a PR with a clear description and test plan.

Husky hooks run leak checks and lint-staged on commit/push.

---

## Adding a decision note

1. Copy [`docs/architecture/decisions/template.md`](../architecture/decisions/template.md) to the next number, e.g.
   `013-short-title.md`.
2. Fill Context, Decision, Alternatives, Consequences — plain language, not formal committee prose.
3. Add a row to [`decisions/README.md`](../architecture/decisions/README.md) index.
4. If the decision changes maintainer status, update [`CURRENT_VS_TARGET.md`](../architecture/CURRENT_VS_TARGET.md) \*
   \*Decision\*\* column.
5. Link related package docs (Redux, integration guides) in the **References** section.

Write one for framework choices, public API/config contracts, explicit non-goals, and licensing/ecosystem alignment.
Skip routine fixes and dependency bumps.

Status values: **Documented** · **Open** · **Deprecated** · **Superseded by Decision NNN**

---

## Updating documentation

| Change type             | Update                                                              |
| ----------------------- | ------------------------------------------------------------------- |
| New integration pattern | `docs/integration/*` + link from [docs/README.md](../README.md)     |
| Status matrix           | [CURRENT_VS_TARGET.md](../architecture/CURRENT_VS_TARGET.md)        |
| Ecosystem/deployment    | [ECOSYSTEM.md](../architecture/ECOSYSTEM.md) (public patterns only) |
| Package behavior        | Package `README.md` and/or `packages/*/docs/`                       |

---

## Package layout

Monorepo packages under `packages/` and demo apps under `apps/`:

- Workspace dependencies use `workspace:^`
- Published packages under `@mapsight/*` scope
- Build: `tsconfig.build.json` for emit; tests in main `tsconfig.json`

Adding a new package: follow an existing package’s `package.json`, tsconfig split, and turbo pipeline entries.

---

## Releases

Published `@mapsight/*` packages are versioned from the monorepo root
with [Changesets](https://github.com/changesets/changesets).

**Contributors:** when maintainers request it, add a changeset in your PR:

```bash
pnpm changeset
```

CI verifies pending changesets with `pnpm changeset status --since=main`.

**Maintainers:** pushing to `main` runs
the [release workflow](https://github.com/open-mapsight/mapsight/blob/main/.github/workflows/ci.yml) (
`changesets/action`):

1. Opens or updates a “Version Packages” PR (`pnpm run version-packages`: version bumps, changelogs, and refreshed
   starter `@mapsight/*` pins), or
2. When that PR merges, runs `pnpm run release` (`turbo build` + `changeset publish`) to publish to npm (OIDC — no
   manual `npm publish` from package directories).

Do not use per-package `npm version` / `npm publish`.

Before merging a release PR that introduces a new package name, configure the
npm package record and trusted publisher first; see
[npm Trusted Publishing](NPM_TRUSTED_PUBLISHING.md).

---

## Questions

Open a [GitHub issue](https://github.com/open-mapsight/mapsight/issues) for code, documentation, and integration
questions.

For licensing and trademark questions, email [contact@open-mapsight.org](mailto:contact@open-mapsight.org) — see
[LICENSING.md](../LICENSING.md) and [TRADEMARK.md](../TRADEMARK.md).

---

## Related

- [Standards](STANDARDS.md)
- [Decision index](../architecture/decisions/README.md)
- [Docs hub](../README.md)
