import "./install-ol-node-env.ts";

import {createMapBitmapRenderer} from "./create-renderer.ts";
import type {MapBitmap, RenderPngOptions} from "./types.ts";

export {createMapBitmapRenderer} from "./create-renderer.ts";
export {installOlNodeEnv} from "./install-ol-node-env.ts";
export {DEFAULT_USER_AGENT} from "./types.ts";
export type {
	CreateMapBitmapRendererOptions,
	GeoJsonFeatureCollection,
	LayerSpec,
	LonLat,
	MapBitmap,
	MapBitmapRenderer,
	OlLayerSpec,
	RenderPngOptions,
	VectorFeatures,
	VectorLayerSpec,
	ViewSpec,
	XyzLayerSpec,
} from "./types.ts";

/** One-shot PNG. Prefer {@link createMapBitmapRenderer} when rendering more than once. */
export async function renderPng(options: RenderPngOptions): Promise<MapBitmap> {
	const renderer = await createMapBitmapRenderer(options);
	try {
		return await renderer.render();
	} finally {
		renderer.dispose();
	}
}
