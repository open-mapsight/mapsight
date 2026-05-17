import XML from "ol/format/XML";

import type {Definition} from "@/ol-proxy";

type Ctor = typeof XML;

export default {
	type: "XMLFormat",
	Constructor: XML,
	optionMap: {},
} satisfies Definition<Ctor>;
