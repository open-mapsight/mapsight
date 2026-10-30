# `@mapsight/showcase`

Ecosystem showcase app for contributors: Mapsight UI demos, icon catalog, runtime icons, and related package
surfaces.

## Commands

From the monorepo root:

```bash
pnpm --filter @mapsight/showcase dev
pnpm --filter @mapsight/showcase build
pnpm --filter @mapsight/showcase start
```

- `dev` — compile demo vector styles, copy traffic-style icons, then start Vite
- `build` — production Vite build (after style compile + icon copy)
- `start` — preview the production build

See also [React SPA integration](../../docs/integration/REACT_SPA.md) and the [documentation hub](../../docs/README.md).
