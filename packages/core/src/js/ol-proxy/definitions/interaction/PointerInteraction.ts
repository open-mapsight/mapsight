import Pointer from "ol/interaction/Pointer";

import type {Definition} from "@/ol-proxy";

import base from "./_base";

type Ctor = typeof Pointer;

export default {
	type: "PointerInteraction",
	Constructor: Pointer,
	optionMap: {
		...base.optionMap,
	},
	initialOptionMap: {
		...base.initialOptionMap,
		handleDownEvent: "handleDownEvent",
		handleDragEvent: "handleDragEvent",
		handleEvent: "handleEvent",
		handleMoveEvent: "handleMoveEvent",
		handleUpEvent: "handleUpEvent",
	},
} satisfies Definition<Ctor>;
