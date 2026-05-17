import TextFeature from "ol/format/TextFeature";

import type {Definition} from "@/ol-proxy";

type Ctor = typeof TextFeature;

export default {
	type: "TextFeatureFormat",
	Constructor: TextFeature,
	optionMap: {},
} satisfies Definition<Ctor>;
