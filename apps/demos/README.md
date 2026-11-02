# `@mapsight/demos`

Developer demos for contributors: UI components, count aggregation, the icon
catalog, and runtime icons. This private workspace app is deployed at
<https://preview.open-mapsight.org>. Curated examples live separately at the
[Mapsight showcase](https://showcase.open-mapsight.org).

## Commands

From the monorepo root:

```bash
pnpm --filter @mapsight/demos dev
pnpm --filter @mapsight/demos build
pnpm --filter @mapsight/demos start
```

- `dev` — compile demo vector styles, copy traffic-style icons, then start Vite
- `build` — production Vite build (after style compile + icon copy)
- `start` — preview the production build

See also [React SPA integration](../../docs/integration/REACT_SPA.md) and the [documentation hub](../../docs/README.md).
