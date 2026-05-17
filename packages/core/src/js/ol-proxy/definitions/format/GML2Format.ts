import GML2 from "ol/format/GML2";

import type {Definition} from "@/ol-proxy";

type Ctor = typeof GML2;

export default {
	type: "GML2Format",
	Constructor: GML2,
	optionMap: {},
} satisfies Definition<Ctor>;
