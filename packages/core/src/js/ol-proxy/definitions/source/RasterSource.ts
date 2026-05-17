import Raster from "ol/source/Raster";

import type {Definition} from "@/ol-proxy";

import base from "./_base";

type Ctor = typeof Raster;
export default {
	type: "RasterSource",
	Constructor: Raster,
	optionMap: {...base.optionMap, operation: "setOperation"},
	initialOptionMap: {
		...base.initialOptionMap,
		sources: "sources",
		operation: "operation",
		lib: "lib",
		threads: "threads",
		operationType: "operationType",
	},
} satisfies Definition<Ctor>;
