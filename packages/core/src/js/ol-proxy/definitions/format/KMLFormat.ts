import KML from "ol/format/KML";

import type {Definition} from "@/ol-proxy";

type Ctor = typeof KML;

export default {
	type: "KMLFormat",
	Constructor: KML,
	optionMap: {},
} satisfies Definition<Ctor>;
