import GML3 from "ol/format/GML3";

import type {Definition} from "@/ol-proxy";

type Ctor = typeof GML3;

export default {
	type: "GML3Format",
	Constructor: GML3,
	optionMap: {},
} satisfies Definition<Ctor>;
