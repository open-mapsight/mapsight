import DragZoom from "ol/interaction/DragZoom";

import type {Definition} from "@/ol-proxy";

import DragBoxInteraction from "./DragBoxInteraction";

type Ctor = typeof DragZoom;

export default {
	type: "DragZoomInteraction",
	Constructor: DragZoom,
	optionMap: {
		...DragBoxInteraction.optionMap,
	},
	initialOptionMap: {
		...DragBoxInteraction.initialOptionMap,
		duration: "duration",
		out: "out",
	},
} satisfies Definition<Ctor>;
