import PinchZoom from "ol/interaction/PinchZoom";

import type {Definition} from "@/ol-proxy";

import base from "./_base";

type Ctor = typeof PinchZoom;

export default {
	type: "PinchZoomInteraction",
	Constructor: PinchZoom,
	optionMap: {
		...base.optionMap,
	},
	initialOptionMap: {
		...base.initialOptionMap,
	},
} satisfies Definition<Ctor>;
