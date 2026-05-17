import TopoJSON from "ol/format/TopoJSON";

import type {Definition} from "@/ol-proxy";

type Ctor = typeof TopoJSON;

export default {
	type: "TopoJSONFormat",
	Constructor: TopoJSON,
	optionMap: {},
} satisfies Definition<Ctor>;
