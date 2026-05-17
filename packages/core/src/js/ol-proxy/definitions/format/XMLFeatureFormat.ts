import XMLFeature from "ol/format/XMLFeature";

import type {Definition} from "@/ol-proxy";

type Ctor = typeof XMLFeature;

export default {
	type: "XMLFeatureFormat",
	Constructor: XMLFeature,
	optionMap: {},
} satisfies Definition<Ctor>;
