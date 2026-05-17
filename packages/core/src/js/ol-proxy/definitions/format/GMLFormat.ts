import GML from "ol/format/GML";

import type {Definition} from "@/ol-proxy";

type Ctor = typeof GML;

export default {
	type: "GMLFormat",
	Constructor: GML,
	optionMap: {},
} satisfies Definition<Ctor>;
