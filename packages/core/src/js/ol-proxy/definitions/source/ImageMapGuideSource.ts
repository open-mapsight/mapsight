import ImageMapGuide from "ol/source/ImageMapGuide";

import type {Definition} from "@/ol-proxy";

import base from "./_base";

type Ctor = typeof ImageMapGuide;

export default {
	type: "ImageMapGuideSource",
	Constructor: ImageMapGuide,
	optionMap: {
		...base.optionMap,
		imageLoadFunction: "setImageLoadFunction",
		params: "updateParams",
	},
	initialOptionMap: {
		...base.initialOptionMap,
		url: "url",
		displayDpi: "displayDpi",
		metersPerUnit: "metersPerUnit",
		hidpi: "hidpi",
		useOverlay: "useOverlay",
		projection: "projection",
		ratio: "ratio",
		resolutions: "resolutions",
		imageLoadFunction: "imageLoadFunction",
		params: "params",
	},
} satisfies Definition<Ctor>;
