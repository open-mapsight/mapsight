import GPX from "ol/format/GPX";

import type {Definition} from "@/ol-proxy";

type Ctor = typeof GPX;

export default {
	type: "GPXFormat",
	Constructor: GPX,
	optionMap: {},
} satisfies Definition<Ctor>;
