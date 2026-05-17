import WMSCapabilities from "ol/format/WMSCapabilities";

import type {Definition} from "@/ol-proxy";

type Ctor = typeof WMSCapabilities;

export default {
	type: "WMSCapabilitiesFormat",
	Constructor: WMSCapabilities,
	optionMap: {},
} satisfies Definition<Ctor>;
