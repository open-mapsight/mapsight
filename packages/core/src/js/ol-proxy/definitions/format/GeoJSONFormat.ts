import GeoJSON from "ol/format/GeoJSON";

import type {Definition} from "@/ol-proxy";

type Ctor = typeof GeoJSON;

export default {
	type: "GeoJSONFormat",
	Constructor: GeoJSON,
	optionMap: {},
	initialOptionMap: {
		defaultDataProjection: "defaultDataProjection",
		featureProjection: "featureProjection",
		geometryName: "defaultDataProjection",
	},
} satisfies Definition<Ctor>;
