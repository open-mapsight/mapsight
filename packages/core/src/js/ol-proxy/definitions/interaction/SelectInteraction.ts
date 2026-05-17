import Select from "ol/interaction/Select";

import type {Definition} from "@/ol-proxy";

import base from "./_base";

type Ctor = typeof Select;

export default {
	type: "SelectInteraction",
	Constructor: Select,
	optionMap: {
		...base.optionMap,
	},
	initialOptionMap: {
		...base.initialOptionMap,
	},
} satisfies Definition<Ctor>;
