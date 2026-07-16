# Getting started

Minimal path: install packages → style function → config JSON → mount a map. **No municipal stack required.**

Mapsight in this repository is **WIP** — the steps below reflect the npm library contract; production CMS deployments
add host builds, data pipelines, and ops layers (see [Integration overview](integration/OVERVIEW.md)).

---

## Prerequisites

- Node 24+, pnpm (monorepo) or npm/yarn in your app
- A DOM container (`<div id="map">`)

---

## Install

```bash
pnpm add @mapsight/ui @mapsight/core @mapsight/lib-ol @mapsight/traffic-style
```

Add peer dependencies (`react`, `react-dom`, `ol`, …) as required by your bundler — see `@mapsight/ui` on npm.

---

## 1. Style function

Mapsight needs a compiled vector `styleFunction` (OpenLayers styling). Fastest path: build from
`@mapsight/traffic-style` or `@mapsight/vector-style-compiler` —
see [traffic-style README](../packages/traffic-style/README.md).

---

## 2. Minimal config

```ts
const mapsightConfig = {
	map: {
		layers: {
			osm: {
				type: "OSM",
				options: {
					url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
				},
			},
		},
	},
	featureSources: {
		pois: {type: "xhr-json", url: "/data/pois.geojson"},
	},
	list: {
		featureSource: "pois",
		visible: true,
	},
};
```

Validated in development via Zod — see [Config reference](integration/CONFIG_REFERENCE.md).

**Basemaps:** raw OSM URLs are fine for local dev. Production hosts usually use a self-hosted or proxied basemap —
see [Ecosystem § basemaps](architecture/ECOSYSTEM.md).

---

## 3. Mount in the browser

```ts
import {create} from "@mapsight/ui";

import styleFunction from "./generated/styleFunction";

const el = document.getElementById("map");
if (el) {
	create(el, styleFunction, mapsightConfig);
}
```

---

## 4. CMS embed path

CMS hosts use Vite lib mode, stable asset URLs, and **`browserEmbed`** from `@mapsight/ui/embed/browser`:

```ts
import browserEmbed from "@mapsight/ui/embed/browser";

import {simpleMap} from "./presets/simpleMap";

browserEmbed(containerElement, simpleMap({/* inline options */}));
```

Full build + snippet pattern: [CMS_PHP](integration/CMS_PHP.md), the reference starter [
`starters/mapsight-host-starter`](../starters/mapsight-host-starter), and [
`@mapsight/vite-host-embed`](../packages/vite-host-embed/README.md).

For count-aggregator CMS pages (full app shell, not lib-mode map embeds), see [
`count-aggregator-ui`](../packages/count-aggregator-ui/README.md#cms-app-shell-embed).

---

## Next steps

| Goal                    | Read                                                              |
| ----------------------- | ----------------------------------------------------------------- |
| Full config anatomy     | [CONFIG_REFERENCE](integration/CONFIG_REFERENCE.md)               |
| SPA integration         | [REACT_SPA](integration/REACT_SPA.md)                             |
| Next.js                 | [NEXTJS](integration/NEXTJS.md)                                   |
| Municipal data pipeline | [PULP](integration/PULP.md)                                       |
| Architecture depth      | [Redux architecture](../packages/core/docs/REDUX_ARCHITECTURE.md) |
