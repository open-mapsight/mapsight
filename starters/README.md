# Mapsight starters

Copy-out **host integration templates** for Mapsight. Each directory under `starters/` is a self-contained project
integrators can copy into their own repository — not published as a monorepo unit.

Every starter uses **semver `@mapsight/*` pins** from npm. After copying a folder, run `npm install` and `npm run dev`
or `npm run build` in your own repository.

See each starter’s README for deploy paths, snippet patterns, and customization.

---

## Maturity matrix

| Starter                                                   | Status   | Integration doc                                                                                              | Smoke test                 |
| --------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------ | -------------------------- |
| [`mapsight-host-starter`](mapsight-host-starter/)         | **Beta** | [CMS_PHP.md](../docs/integration/CMS_PHP.md), [CONFIG_REFERENCE.md](../docs/integration/CONFIG_REFERENCE.md) | dev page + built snippet   |
| [`mapsight-next-starter`](mapsight-next-starter/)         | **WIP**  | [NEXTJS.md](../docs/integration/NEXTJS.md)                                                                   | `next start` + map mount   |
| [`mapsight-vite-spa-starter`](mapsight-vite-spa-starter/) | **WIP**  | [REACT_SPA.md](../docs/integration/REACT_SPA.md)                                                             | `vite preview` + map mount |

[`apps/showcase`](../apps/showcase) remains the rich React Router reference for **features**; the Vite SPA starter is
the **minimal copy-out** reference.

---

## Copy-out workflow

1. Copy one starter folder into your host repository.
2. `npm install` (or pnpm/yarn).
3. `npm run dev` for local development, or `npm run build` for production assets.

Starter READMEs use GitHub URLs for integration docs so links work after copy-out.

---

## Maintainer workflow (Mapsight monorepo)

From the repo root:

```bash
pnpm --filter mapsight-host-starter dev
pnpm --filter mapsight-host-starter build
pnpm --filter mapsight-next-starter dev
pnpm --filter mapsight-next-starter build
pnpm --filter mapsight-vite-spa-starter dev
pnpm --filter mapsight-vite-spa-starter build
pnpm lint:starters
pnpm run sync:starter-pins
pnpm run test:starters:e2e
```

### Workspace package sync

Before `dev` or `build`, each starter’s `prebuild` runs a thin [
`scripts/sync-workspace-mapsight.mts`](mapsight-host-starter/scripts/sync-workspace-mapsight.mts) stub that delegates
to [`scripts/sync-workspace-mapsight.mts`](../scripts/sync-workspace-mapsight.mts) when `../../scripts/` exists (
Mapsight checkout). **No-op** when the starter is copied elsewhere.

### Linting

Starters ship **without** local `eslint.config.*`. Lint from the repo root:

```bash
pnpm lint:starters
```

Shared config: [`eslint.config.mts`](eslint.config.mts) (not shipped with templates).

### Semver pins (`package.json`)

Starters must not use `catalog:` or `workspace:` — only npm semver pins copy-out integrators can install.

`@mapsight/*` pins are refreshed automatically when the changesets bot opens or updates the **Version Packages** PR
(`pnpm run version-packages` → `changeset version` + `sync:starter-pins`). To refresh catalog-backed pins manually, or
when testing locally:

```bash
pnpm run sync:starter-pins
pnpm run check:starter-pins
```

`check:starter-pins` is part of `pnpm run check`.

Until `@mapsight/vite-host-embed` is on npm, the monorepo root [`pnpm-workspace.yaml`](../pnpm-workspace.yaml) uses a
`workspace:*` override so `pnpm install` links the local package while starters keep a semver pin (`1.0.0`). Remove that
override after the first npm publish.

Implementation plan: [`HANDOFF.md`](HANDOFF.md).
