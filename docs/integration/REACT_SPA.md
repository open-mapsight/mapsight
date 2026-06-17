# React SPA integration

**Copy-out template:** [`starters/mapsight-vite-spa-starter`](../../starters/mapsight-vite-spa-starter) — minimal Vite +
React Router SPA with one map route and semver `@mapsight/*` pins.

**Feature demo:** [`apps/showcase`](../../apps/showcase) — richer UI surface (icon catalog, count-aggregator, TanStack
Query) for contributors exploring package capabilities.

Use this when Mapsight is the **primary frontend** (demo apps, internal tools, standalone dashboards) rather than a CMS
HTML snippet.

---

## When to use an SPA vs CMS embed

| CMS embed                            | React SPA                              |
| ------------------------------------ | -------------------------------------- |
| Editorial paste-in placements        | Developer-owned routes and layout      |
| Shared lib build + inline config     | Single app bundle or code-split routes |
| Host CMS owns chrome                 | App owns chrome (nav, footer)          |
| Primary municipal communicative maps | Demos, showcases, count-aggregator lab |

Many production **communicative** maps use CMS embeds; SPAs prove package integration and support contributor
development.

---

## Stack

| Piece       | Choice in vite-spa starter        | Showcase extras                        |
| ----------- | --------------------------------- | -------------------------------------- |
| Bundler     | Vite                              | Same                                   |
| Routing     | React Router 7                    | Same                                   |
| Map runtime | `@mapsight/core` + OpenLayers     | Same                                   |
| UI          | `@mapsight/ui` `Instance` + `App` | Additional demo pages                  |
| Async data  | Static GeoJSON URL in config      | TanStack Query (count-aggregator demo) |
| Styling     | Mapsight SCSS (no Tailwind)       | Tailwind v4 + Mapsight SCSS/CSS        |

---

## Integration pattern

1. **Create store** via `@mapsight/ui` `Instance` (or lower-level `create()`) on a route-mounted container ref.
2. **Load config** from route params, static JSON, or fetched at runtime — unlike CMS embeds, config often lives in TS
   modules.
3. **Style pipeline** — run `vector-style-compiler` and copy traffic-style icons as part of `npm run build` (see starter
   `package.json` scripts).
4. **Assets** — copy `@mapsight/traffic-style` image dirs to `public/img/` for map icons (`mapsight-icons*`). UI chrome
   icons (`mapsight-ui/*`) resolve from `@mapsight/ui` through SCSS (`$ms3-iconPath: "~@mapsight/ui/dist/img/"`) and are
   emitted as bundler assets — see [`apps/showcase/src/msui.scss`](../../apps/showcase/src/msui.scss).

The vite-spa starter mounts the map only on `/`. Navigating to `/about` unmounts `Instance` and tears down its store. If
you keep `Instance` at a layout level across routes, call `resetMapsightCore` when leaving map modules — see the starter
README.

---

## Count Aggregator demo

Showcase includes a count-aggregator page wired to a **local mock API** (`vite.count-aggregator-mock.ts`) so
contributors can exercise `@mapsight/count-aggregator-ui` without a live platform. Replace mock base URL with host
platform public API in production apps.

See [DATA_BACKEND.md](DATA_BACKEND.md) for the optional platform pattern.

---

## TanStack Router (pattern only)

Private host apps may use TanStack Router instead of React Router. Integration rules:

- Mount embed or full Mapsight route component on leaf routes
- Call `resetMapsightCore` when leaving map routes to avoid stale global store state
- Use path-scoped containers — one store per mount unless intentionally sharing via `mergeAll`

No TanStack Router reference app ships in the public monorepo; follow the vite-spa starter embed lifecycle with router
lifecycle hooks.

---

## Development commands

**Copy-out (outside monorepo):**

```bash
cd mapsight-vite-spa-starter
npm install
npm run dev
npm run build
```

**Inside Mapsight monorepo:**

```bash
pnpm --filter mapsight-vite-spa-starter dev
pnpm --filter mapsight-vite-spa-starter build
pnpm --filter @mapsight/showcase dev
pnpm --filter @mapsight/showcase build
```

Run typecheck/lint via turbo from root: `pnpm typecheck`, `pnpm lint`.

---

## Related

- [Integration overview](OVERVIEW.md)
- [NEXTJS.md](NEXTJS.md)
- [DATA_BACKEND.md](DATA_BACKEND.md)
- [Redux architecture](../../packages/core/docs/REDUX_ARCHITECTURE.md)
