import DragRotateAndZoom from "ol/interaction/DragRotateAndZoom";

import type {Definition} from "@/ol-proxy";

import base from "./_base";

type Ctor = typeof DragRotateAndZoom;

export default {
	type: "DragRotateAndZoomInteraction",
	Constructor: DragRotateAndZoom,
	optionMap: {
		...base.optionMap,
	},
	initialOptionMap: {
		...base.initialOptionMap,
		condition: "condition",
		duration: "duration",
	},
} satisfies Definition<Ctor>;
