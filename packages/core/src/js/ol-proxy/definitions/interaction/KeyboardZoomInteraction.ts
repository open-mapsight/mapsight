import KeyboardZoom from "ol/interaction/KeyboardZoom";

import type {Definition} from "@/ol-proxy";

import base from "./_base";

type Ctor = typeof KeyboardZoom;

export default {
	type: "KeyboardZoomInteraction",
	Constructor: KeyboardZoom,
	optionMap: {
		...base.optionMap,
	},
	initialOptionMap: {
		...base.initialOptionMap,
		condition: "condition",
		duration: "duration",
		delta: "delta",
	},
} satisfies Definition<Ctor>;
