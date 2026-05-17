import DragRotate from "ol/interaction/DragRotate";

import type {Definition} from "@/ol-proxy";

import PointerInteraction from "./PointerInteraction";

type Ctor = typeof DragRotate;

export default {
	type: "DragRotateInteraction",
	Constructor: DragRotate,
	optionMap: {
		...PointerInteraction.optionMap,
	},
	initialOptionMap: {
		...PointerInteraction.initialOptionMap,
		condition: "condition",
		duration: "duration",
	},
} satisfies Definition<Ctor>;
