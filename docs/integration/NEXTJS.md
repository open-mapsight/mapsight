# Next.js integration

Reference pattern: [`starters/mapsight-next-starter`](../../starters/mapsight-next-starter) — Next.js App Router host
loading Mapsight packages.

Use Next when the host application is already React/Next-centric (marketing site, municipal app shell, or future
full-stack map pages).

---

## Starter scope

- Next.js 16 App Router alongside `@mapsight/core` and `@mapsight/ui`
- Vector style compile step in build pipeline
- Static asset copying of traffic-style icons to `public/img/`
- UI chrome icons bundled from `@mapsight/ui` via SCSS (`$ms3-iconPath: "~@mapsight/ui/dist/img/"`)
- Client-side map mount in a `"use client"` component

It is a **minimal copy-out template**, not a production CMS replacement. For richer UI demos, use [
`apps/showcase`](../../apps/showcase).

---

## Client vs server boundaries

Mapsight today assumes **browser APIs** (OpenLayers, DOM container). Map components should be **client components** (
`"use client"`) or dynamically imported with `ssr: false` where Next would otherwise prerender the canvas.

**SSR hydration:** Next can SSR page chrome around the map. Mapsight’s dehydrated-state
contract ([SSR_HYDRATION.md](SSR_HYDRATION.md)) may align with Next SSR routes — **evaluate; not mandated** by the
starter yet. See [Decision 006](../architecture/decisions/006-ssr-state-hydration-goal.md).

---

## i18n

**No Next i18n library is chosen for Mapsight.** Per-embed `lang` props and host-owned locale routing remain the status
quo until [Decision 008](../architecture/decisions/008-i18n-approach.md) selects an OSS i18n stack. Do not assume
`next-intl` or similar in shared packages.

---

## Build pipeline

Typical steps:

1. `vector-style-compiler` — generate style modules under `src/generated/`
2. Copy traffic-style icons to `public/img/` (`mapsight-icons*`)
3. `next build --webpack` — UI chrome icons from `@mapsight/ui` via SCSS; Webpack required for `@mapsight/traffic-style`
   subpath resolution today

From repo root:

```bash
pnpm --filter mapsight-next-starter dev
pnpm --filter mapsight-next-starter build
```

---

## When Next vs CMS embed

| Choose CMS embed                   | Choose Next host                          |
| ---------------------------------- | ----------------------------------------- |
| Editorial CMS owns pages           | App team owns all routes                  |
| Many topical embeds on one domain  | Map features are part of a JS application |
| PHP/Java CMS already in production | Greenfield or Next-native stack           |

Communicative maps on **Infosite/TYPO3** pages still favor [CMS_PHP.md](CMS_PHP.md) even when other site areas use Next.

---

## Related

- [SSR_HYDRATION.md](SSR_HYDRATION.md)
- [REACT_SPA.md](REACT_SPA.md)
- [Integration overview](OVERVIEW.md)
