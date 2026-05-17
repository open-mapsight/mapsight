import WMTS from "ol/source/WMTS";

import type {Definition} from "@/ol-proxy";

import base from "./TileImageSource";

type Ctor = typeof WMTS;

export default {
	type: "WMTSSource",
	Constructor: WMTS,
	optionMap: {...base.optionMap, dimensions: "updateDimensions"},
	initialOptionMap: {
		...base.initialOptionMap,
		version: "version",
		format: "format",
		matrixSet: "matrixSet",
		dimensions: "dimensions",
		//capabilities TODO, see ol.source.WMTS.optionsFromCapabilities
	},
} satisfies Definition<Ctor>;
