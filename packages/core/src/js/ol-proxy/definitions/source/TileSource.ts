import Tile from "ol/source/Tile";

import type {Definition} from "@/ol-proxy";

import base from "./_base";

type Ctor = typeof Tile;

export default {
	type: "TileSource",
	Constructor: Tile,
	optionMap: {
		...base.optionMap,
	},
	initialOptionMap: {
		...base.initialOptionMap,
	},
} satisfies Definition<Ctor>;
