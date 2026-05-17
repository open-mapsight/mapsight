import ImageStatic from "ol/source/ImageStatic";

import type {Definition} from "@/ol-proxy";

import base from "./_base";

type Ctor = typeof ImageStatic;

export default {
	type: "ImageStaticSource",
	Constructor: ImageStatic,
	optionMap: {...base.optionMap},
	initialOptionMap: {
		...base.initialOptionMap,
		crossOrigin: "crossOrigin",
		imageExtent: "imageExtent",
		imageLoadFunction: "imageLoadFunction",
		logo: "logo",
		projection: "projection",
		imageSize: "imageSize",
		url: "url",
	},
} satisfies Definition<Ctor>;
