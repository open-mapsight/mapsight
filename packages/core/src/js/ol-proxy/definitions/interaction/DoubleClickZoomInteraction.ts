import DoubleClickZoom from "ol/interaction/DoubleClickZoom";

import type {Definition} from "@/ol-proxy";

import base from "./_base";

type Ctor = typeof DoubleClickZoom;

export default {
	type: "DoubleClickZoomInteraction",
	Constructor: DoubleClickZoom,
	optionMap: {
		...base.optionMap,
	},
	initialOptionMap: {
		...base.initialOptionMap,
		duration: "duration",
		delta: "delta",
	},
} satisfies Definition<Ctor>;
