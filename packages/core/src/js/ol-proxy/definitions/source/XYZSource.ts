import XYZ from "ol/source/XYZ";

import type {Definition} from "@/ol-proxy";

import base from "./TileImageSource";

type Ctor = typeof XYZ;

export default {
	type: "XYZSource",
	Constructor: XYZ,
	optionMap: {...base.optionMap},
	initialOptionMap: {
		...base.initialOptionMap,
		minZoom: "minZoom",
		maxZoom: "maxZoom",
	},
} satisfies Definition<Ctor>;
