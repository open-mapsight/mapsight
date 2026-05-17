import TileImage from "ol/source/TileImage";

import type {Definition} from "@/ol-proxy";

import base from "./UrlTileSource";

type Ctor = typeof TileImage;

export default {
	type: "TileImageSource",
	Constructor: TileImage,
	optionMap: {
		...base.optionMap,
		renderReprojectionEdges: "setRenderReprojectionEdges", //tileGridForProjection: ..., see setTileGridForProjection TODO could be represented by an key-value map
	},
	initialOptionMap: {
		...base.initialOptionMap,
		cacheSize: "cacheSize",
		crossOrigin: "crossOrigin",
		logo: "logo",
		opaque: "opaque",
		projection: "projection",
		reprojectionErrorThreshold: "reprojectionErrorThreshold",
		state: "state",
		tileClass: "tileClass",
		tileGrid: "tileGrid",
		tilePixelRatio: "tilePixelRatio",
		wrapX: "wrapX",
		transition: "transition",
	},
} satisfies Definition<Ctor>;
