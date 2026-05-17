import ImageWMS from "ol/source/ImageWMS";

import type {Definition} from "@/ol-proxy";

import base from "./_base";

type Ctor = typeof ImageWMS;

export default {
	type: "ImageWMSSource",
	Constructor: ImageWMS,
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
		serverType: "serverType",
		imageLoadFunction: "imageLoadFunction",
		logo: "logo",
		params: "params",
		projection: "projection",
		ratio: "ratio",
		resolutions: "resolutions",
		url: "url",
	},
} satisfies Definition<Ctor>;
