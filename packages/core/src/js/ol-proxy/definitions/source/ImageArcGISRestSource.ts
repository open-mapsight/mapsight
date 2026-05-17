import ImageArcGISRestSource from "ol/source/ImageArcGISRest";

import type {Definition} from "@/ol-proxy";

import base from "./_base";

type Ctor = typeof ImageArcGISRestSource;

export default {
	type: "ImageArcGISRestSource",
	Constructor: ImageArcGISRestSource,
	optionMap: {
		...base.optionMap,
		imageLoadFunction: "setImageLoadFunction",
		params: "updateParams",
		url: "setUrl",
	},
	initialOptionMap: {
		...base.initialOptionMap,
		crossOrigin: "crossOrigin",
		hidpi: "hidpi",
		logo: "logo",
		imageLoadFunction: "imageLoadFunction",
		params: "params",
		projection: "projection",
		ratio: "ratio",
		resolutions: "resolutions",
		url: "url",
	},
} satisfies Definition<Ctor>;
