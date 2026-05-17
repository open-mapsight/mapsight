import OSMXML from "ol/format/OSMXML";

import type {Definition} from "@/ol-proxy";

type Ctor = typeof OSMXML;

export default {
	type: "OSMXMLFormat",
	Constructor: OSMXML,
	optionMap: {},
} satisfies Definition<Ctor>;
