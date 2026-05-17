import Interaction from "ol/interaction/Interaction";

import type {Definition} from "@/ol-proxy";

import base from "./_base";

// TODO: do we really need this?

type Ctor = typeof Interaction;

export default {
	type: "InteractionInteraction",
	Constructor: Interaction,
	optionMap: {
		...base.optionMap,
	},
	initialOptionMap: {
		...base.initialOptionMap,
	},
} satisfies Definition<Ctor>;
