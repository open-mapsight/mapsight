import Snap from "ol/interaction/Snap";

import type {Definition} from "@/ol-proxy";

import base from "./_base";

type Ctor = typeof Snap;

export default {
	type: "SnapInteraction",
	Constructor: Snap,
	optionMap: {
		...base.optionMap,
	},
	initialOptionMap: {
		...base.initialOptionMap,
	},
} satisfies Definition<Ctor>;
