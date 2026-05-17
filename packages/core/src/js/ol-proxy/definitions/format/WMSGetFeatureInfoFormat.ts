import WMSGetFeatureInfo from "ol/format/WMSGetFeatureInfo";

import type {Definition} from "@/ol-proxy";

type Ctor = typeof WMSGetFeatureInfo;

export default {
	type: "WMSGetFeatureInfoFormat",
	Constructor: WMSGetFeatureInfo,
	optionMap: {},
} satisfies Definition<Ctor>;
