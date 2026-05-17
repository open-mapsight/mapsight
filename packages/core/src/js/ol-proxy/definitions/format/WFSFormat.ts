import WFS from "ol/format/WFS";

import type {Definition} from "@/ol-proxy";

type Ctor = typeof WFS;

export default {
	type: "WFSFormat",
	Constructor: WFS,
	optionMap: {},
} satisfies Definition<Ctor>;
