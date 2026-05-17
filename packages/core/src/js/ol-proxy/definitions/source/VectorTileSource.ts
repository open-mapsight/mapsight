import VectorTileSource from "@/lib/map/lib/VectorTileSource";
import type {Definition} from "@/ol-proxy";
import {createDependencyMapper, di} from "@/ol-proxy";

import base from "./UrlTileSource";

type Ctor = typeof VectorTileSource;

export default {
	type: "VectorTileSource",
	Constructor: VectorTileSource,
	optionMap: {...base.optionMap},
	initialOptionMap: {
		...base.initialOptionMap,
		format: createDependencyMapper(di, "format"),
		cacheSize: "cacheSize",
		logo: "logo",
		overlaps: "overlaps",
		projection: "projection",
		state: "state",
		tileClass: "tileClass",
		tileGrid: "tileGrid",
		wrapX: "wrapX",
		transition: "transition",
		timer: "setTimer",
		doRefresh: "setDoRefresh",
	},
} satisfies Definition<Ctor>;
