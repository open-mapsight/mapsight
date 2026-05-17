import KeyboardPan from "ol/interaction/KeyboardPan";

import type {Definition} from "@/ol-proxy";

import base from "./_base";

type Ctor = typeof KeyboardPan;

export default {
	type: "KeyboardPanInteraction",
	Constructor: KeyboardPan,
	optionMap: {
		...base.optionMap,
	},
	initialOptionMap: {
		...base.initialOptionMap,
		condition: "condition",
		duration: "duration",
		pixelDelta: "pixelDelta",
	},
} satisfies Definition<Ctor>;
