import Map from "ol/Map";

import type {Definition} from "..";
import {OPTION_SET} from "..";

type Ctor = typeof Map;

export default {
	type: "Map",
	Constructor: Map,
	optionMap: {
		pixelRatio: OPTION_SET,
		loadTilesWhileAnimating: OPTION_SET,
		loadTilesWhileInteracting: OPTION_SET,
		moveTolerance: OPTION_SET,
		renderer: OPTION_SET,
		size: "setSize",
		logo: "setLogo",
	},
} satisfies Definition<Ctor>;
