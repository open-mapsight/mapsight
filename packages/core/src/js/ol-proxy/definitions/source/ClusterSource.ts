import ClusterSource from "ol/source/Cluster";

import type {Definition} from "@/ol-proxy";

import base from "./_base";

type Ctor = typeof ClusterSource;

export default {
	type: "ClusterSource",
	Constructor: ClusterSource,
	optionMap: {
		...base.optionMap,
	},
	initialOptionMap: {
		...base.initialOptionMap,
	},
} satisfies Definition<Ctor>;
