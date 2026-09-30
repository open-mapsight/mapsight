# @mapsight/ol-bitmap

Render an OpenLayers Canvas-2D map to a PNG on Node — no browser, no Playwright.

This package installs the OL 10.10 worker / `OffscreenCanvas` globals, draws into
[`@napi-rs/canvas`](https://github.com/Brooooooklyn/canvas), and encodes PNG.
Reuse one renderer and queue vector features after the first tile fetch.

It is **not** the HTML embed sidecar. For dehydrated Redux state and
`browserEmbed`, see
[SSR and state hydration](https://github.com/open-mapsight/mapsight/blob/main/docs/integration/SSR_HYDRATION.md).

## Install

```bash
pnpm add @mapsight/ol-bitmap ol
```

Requires Node `^24.15.0` and OpenLayers `^10.10`. `@napi-rs/canvas` is a native
addon (prebuilt binaries for common platforms).

## Import order

Import this package **before** `ol` in the same process. OL evaluates
`WORKER_OFFSCREEN_CANVAS` when `ol/has.js` first loads. If that flag is false,
`createMapBitmapRenderer` throws.

<!-- prettier-ignore -->
```ts
import {createMapBitmapRenderer, renderPng} from "@mapsight/ol-bitmap";
import Style from "ol/style/Style.js";
```

If another module already imported `ol`, install the env in the process entry
file first:

```ts
import "@mapsight/ol-bitmap/install-ol-node-env";
```

## Quick start

One-shot PNG:

<!-- prettier-ignore -->
```ts
import {renderPng} from "@mapsight/ol-bitmap";
import CircleStyle from "ol/style/Circle.js";
import Fill from "ol/style/Fill.js";
import Stroke from "ol/style/Stroke.js";
import Style from "ol/style/Style.js";

const {buffer} = await renderPng({
	width: 640,
	height: 480,
	view: {center: [10.52, 52.26], zoom: 14},
	layers: [
		{type: "xyz", url: "https://tiles.example.tld/{z}/{x}/{y}.png"},
		{
			type: "vector",
			style: new Style({
				image: new CircleStyle({
					radius: 6,
					fill: new Fill({color: "#dc2626"}),
					stroke: new Stroke({color: "#fff", width: 2}),
				}),
			}),
			features: {
				type: "FeatureCollection",
				features: [
					{
						type: "Feature",
						properties: {},
						geometry: {type: "Point", coordinates: [10.52, 52.26]},
					},
				],
			},
		},
	],
});

await writeFile("map.png", buffer);
```

Reuse a renderer when tiles stay the same and only vector features change:

```ts
import {createMapBitmapRenderer} from "@mapsight/ol-bitmap";

const renderer = await createMapBitmapRenderer({
	width: 640,
	height: 480,
	view: {center: [10.52, 52.26], zoom: 14},
	layers: [
		{type: "xyz", url: "https://tiles.example.tld/{z}/{x}/{y}.png"},
		{type: "vector", key: "pois", style},
	],
});

await renderer.render();
renderer.setVectorFeatures(geojson, "pois");
const {buffer} = await renderer.render();
renderer.dispose();
```

`renderPng` creates a renderer, renders once, and disposes. Prefer
`createMapBitmapRenderer` for more than one frame.

## Layers

| Spec                                       | Role                                                                                                   |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `{type: "xyz", url}`                       | Tile layer. Tiles are fetched with an explicit User-Agent (does not patch global `fetch`).             |
| `{type: "vector", style, key?, features?}` | Vector layer. Default `key` is `"vector"`. Use `setVectorFeatures(features, key)` to replace features. |
| `{type: "layer", layer}`                   | Pass a constructed OpenLayers layer.                                                                   |

View `center` is lon/lat (`EPSG:4326`) unless `projection: "EPSG:3857"`. The map
view is always Web Mercator internally.

Pass `userAgent` to override the default
`MapsightOlBitmap/1.0 (+https://github.com/open-mapsight/mapsight)`.

## Limits

- Canvas-2D styles only (`ol/style/Style`, `Icon`, `Circle`, compiled style
  functions). `WebGLVectorLayer` and other WebGL layers are not supported.
- Process-wide DOM/canvas shims. Do not import this package in a browser bundle.
- Tile hosts that block unknown User-Agents need `userAgent` or a proxy.

## Monorepo

```bash
pnpm --filter @mapsight/ol-bitmap test
pnpm --filter @mapsight/ol-bitmap typecheck
pnpm --filter @mapsight/ol-bitmap build
```
