import TileJSON from "ol/source/TileJSON";

import type {Definition} from "@/ol-proxy";

import base from "./_base";

type Ctor = typeof TileJSON;

export default {
	type: "TileJSONSource",
	Constructor: TileJSON,
	optionMap: {
		...base.optionMap,
	},
	initialOptionMap: {
		...base.initialOptionMap,
		jsonp: "jsonp",
		tileJSON: "tileJSON",
	},
} satisfies Definition<Ctor>;
