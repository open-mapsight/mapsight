import UtfGrid from "ol/source/UTFGrid";

import type {Definition} from "@/ol-proxy";

import base from "./_base";

type Ctor = typeof UtfGrid;

export default {
	type: "TileUTFGridSource",
	Constructor: UtfGrid,
	optionMap: {
		...base.optionMap,
	},
	initialOptionMap: {
		...base.initialOptionMap,
		jsonp: "jsonp",
		preemptive: "preemptive",
		tileJSON: "tileJSON",
		url: "url",
	},
} satisfies Definition<Ctor>;
