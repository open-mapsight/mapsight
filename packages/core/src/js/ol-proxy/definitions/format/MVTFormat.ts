import MVT from "ol/format/MVT";

import type {Definition} from "@/ol-proxy";

type Ctor = typeof MVT;

export default {
	type: "MVTFormat",
	Constructor: MVT,
	optionMap: {},
} satisfies Definition<Ctor>;
