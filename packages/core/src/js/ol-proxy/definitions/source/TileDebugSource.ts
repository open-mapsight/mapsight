import TileDebug from "ol/source/TileDebug";

import type {Definition} from "@/ol-proxy";

import base from "./_base";

type Ctor = typeof TileDebug;

export default {
	type: "TileDebugSource",
	Constructor: TileDebug,
	optionMap: {...base.optionMap},
	initialOptionMap: {
		...base.initialOptionMap,
		projection: "projection",
		tileGrid: "tileGrid",
		wrapX: "wrapX",
	},
} satisfies Definition<Ctor>;
