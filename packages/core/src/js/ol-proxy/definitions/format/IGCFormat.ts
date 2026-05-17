import IGC from "ol/format/IGC";

import type {Definition} from "@/ol-proxy";

type Ctor = typeof IGC;

export default {
	type: "IGCFormat",
	Constructor: IGC,
	optionMap: {},
} satisfies Definition<Ctor>;
