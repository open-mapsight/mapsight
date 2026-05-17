import WMTSCapabilities from "ol/format/WMTSCapabilities";

import type {Definition} from "@/ol-proxy";

type Ctor = typeof WMTSCapabilities;

export default {
	type: "WMTSCapabilitiesFormat",
	Constructor: WMTSCapabilities,
	optionMap: {},
} satisfies Definition<Ctor>;
