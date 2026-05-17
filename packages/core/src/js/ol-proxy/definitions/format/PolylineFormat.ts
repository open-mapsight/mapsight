import Polyline from "ol/format/Polyline";

import type {Definition} from "@/ol-proxy";

type Ctor = typeof Polyline;

export default {
	type: "PolylineFormat",
	Constructor: Polyline,
	optionMap: {},
} satisfies Definition<Ctor>;
