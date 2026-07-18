import type {Definition} from "@/ol-proxy";

import LazyMapboxVectorLayer from "./LazyMapboxVectorLayer";
import base from "./_base";

type Ctor = typeof LazyMapboxVectorLayer;

/**
 * ol-proxy definition for Mapbox / MapLibre style vector tile layers.
 *
 * Uses {@link LazyMapboxVectorLayer} so style JSON is fetched only when the
 * layer first becomes visible. Requires the optional `ol-mapbox-style` peer.
 */
export default {
	type: "MapboxVectorLayer",
	Constructor: LazyMapboxVectorLayer,
	optionMap: {
		...base.optionMap,
		preload: "setPreload",
		useInterimTilesOnError: "setUseInterimTilesOnError",
	},
	initialOptionMap: {
		...base.initialOptionMap,
		styleUrl: "styleUrl",
		accessToken: "accessToken",
		sourceId: "source",
		layers: "layers",
		background: "background",
		declutter: "declutter",
		preload: "preload",
		className: "className",
		minZoom: "minZoom",
		maxZoom: "maxZoom",
		renderBuffer: "renderBuffer",
		renderMode: "renderMode",
		updateWhileAnimating: "updateWhileAnimating",
		updateWhileInteracting: "updateWhileInteracting",
		useInterimTilesOnError: "useInterimTilesOnError",
		properties: "properties",
	},
} satisfies Definition<Ctor>;
