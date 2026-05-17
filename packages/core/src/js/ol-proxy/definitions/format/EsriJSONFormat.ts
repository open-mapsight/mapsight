import EsriJSON from "ol/format/EsriJSON";

import type {Definition} from "@/ol-proxy";

type Ctor = typeof EsriJSON;

export default {
	type: "EsriJSONFormat",
	Constructor: EsriJSON,
	optionMap: {},
} satisfies Definition<Ctor>;
