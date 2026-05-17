import PinchRotate from "ol/interaction/PinchRotate";

import type {Definition} from "@/ol-proxy";

import base from "./_base";

type Ctor = typeof PinchRotate;

export default {
	type: "PinchRotateInteraction",
	Constructor: PinchRotate,
	optionMap: {
		...base.optionMap,
	},
	initialOptionMap: {
		...base.initialOptionMap,
	},
} satisfies Definition<Ctor>;
