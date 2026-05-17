import DragBox from "ol/interaction/DragBox";

import type {Definition} from "@/ol-proxy";

import PointerInteraction from "./PointerInteraction";

type Ctor = typeof DragBox;

export default {
	type: "DragBoxInteraction",
	Constructor: DragBox,
	optionMap: {
		...PointerInteraction.optionMap,
	},
	initialOptionMap: {
		...PointerInteraction.initialOptionMap,
		className: "className",
		condition: "condition",
		minArea: "minArea",
		boxEndCondition: "boxEndCondition",
	},
} satisfies Definition<Ctor>;
