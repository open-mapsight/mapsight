import WKT from "ol/format/WKT";

import type {Definition} from "@/ol-proxy";

type Ctor = typeof WKT;

export default {
	type: "WKTFormat",
	Constructor: WKT,
	optionMap: {},
} satisfies Definition<Ctor>;
