import DragPan from "ol/interaction/DragPan";

import {Kinetic} from "ol";

import type {Definition} from "@/ol-proxy";

import PointerInteraction from "./PointerInteraction";

type Ctor = typeof DragPan;

export default {
	type: "DragPanInteraction",
	Constructor: DragPan,
	optionMap: {
		...PointerInteraction.optionMap,
	},
	initialOptionMap: {
		...PointerInteraction.initialOptionMap,
		condition: "condition", // TODO: function
		// a: [decay, minVelocity, delay]
		kinetic(a) {
			if (a && Array.isArray(a)) {
				return {
					kinetic: new Kinetic(a[0], a[1], a[2]),
				};
			} else {
				return {};
			}
		},
	},
} satisfies Definition<Ctor>;
