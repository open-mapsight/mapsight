# Mapsight Vite SPA starter

**WIP** — minimal **copy-out template** for mounting Mapsight in a Vite + React Router 7 SPA.

The home route (`/`) mounts `Instance` + `App` on a route-scoped container. A second route (`/about`) demonstrates navigation away from the map without a full page reload.

Copy this directory into your Vite repository.

Integration guide: [REACT_SPA.md](https://github.com/open-mapsight/mapsight/blob/main/docs/integration/REACT_SPA.md).

---

## Prerequisites

- Node 24+
- npm, pnpm, or yarn

---

## Local development

```bash
npm install
npm run dev
```

Opens the home route with a map + feature list backed by sample GeoJSON at `public/data.geojson`.

---

## Production build

```bash
npm run build
npm run preview
```

Build pipeline:

1. `vector-style-compiler` → `src/generated/mapsight-vector-styles/`
2. Copy `@mapsight/traffic-style` runtime icons → `public/img/` (`mapsight-icons*`)
3. `vite build` — UI chrome icons (`mapsight-ui/*`) resolve from `@mapsight/ui` via SCSS (`$ms3-iconPath: "~@mapsight/ui/dist/img/"`)

---

## Route mounting

| Route    | Component   | Mapsight                                   |
| -------- | ----------- | ------------------------------------------ |
| `/`      | `MapPage`   | `Instance` + `App` mounted                 |
| `/about` | `AboutPage` | No map — `Instance` unmounts on navigation |

This starter uses **one store per route mount**: leaving `/` tears down the Redux store created by `Instance`. That is the simplest SPA pattern.

If you keep `Instance` at a **layout level** across routes (map chrome always mounted, inner routes swap panels), call `resetMapsightCore` when switching modules:

```ts
import {useEffect} from "react";
import {useStore} from "react-redux";

import {resetMapsightCore} from "@mapsight/ui/store/actions";

import {baseMapsightConfig} from "@/mapsight/map-config";

function useResetMapsightOnLeave(active: boolean) {
	const store = useStore();

	useEffect(() => {
		if (!active) {
			return;
		}

		return () => {
			store.dispatch(resetMapsightCore(baseMapsightConfig));
		};
	}, [active, store]);
}
```

See [ACTION_GUIDE.md](https://github.com/open-mapsight/mapsight/blob/main/packages/core/docs/ACTION_GUIDE.md) for when to use `resetMapsightCore` vs `mergeAll`.

---

## Customize

| Goal         | Edit                                                                                                                 |
| ------------ | -------------------------------------------------------------------------------------------------------------------- |
| Map config   | [`src/mapsight/map-config.ts`](src/mapsight/map-config.ts)                                                           |
| Map route UI | [`src/pages/map-page.tsx`](src/pages/map-page.tsx)                                                                   |
| Vector style | [`src/vector-styles/demo.scss`](src/vector-styles/demo.scss) — rebuild via `npm run build:mapsightStyle`             |
| Demo GeoJSON | [`public/data.geojson`](public/data.geojson)                                                                         |
| App chrome   | [`src/layout/app-layout.tsx`](src/layout/app-layout.tsx), [`src/scss/mapsight-spa.scss`](src/scss/mapsight-spa.scss) |
