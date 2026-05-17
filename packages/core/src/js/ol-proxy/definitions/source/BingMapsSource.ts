import BingMaps from "ol/source/BingMaps";

import type {Definition} from "@/ol-proxy";

import TileImageSource from "./TileImageSource";

type Ctor = typeof BingMaps;

export default {
	type: "BingMapsSource",
	Constructor: BingMaps,
	optionMap: {
		...TileImageSource.optionMap,
	},
	initialOptionMap: {
		...TileImageSource.initialOptionMap,
		culture: "culture",
		key: "key",
		imagerySet: "imagerySet",
		maxZoom: "maxZoom",
	},
} satisfies Definition<Ctor>;
