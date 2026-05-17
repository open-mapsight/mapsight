import ImageCanvas from "ol/source/ImageCanvas";

import type {Definition} from "@/ol-proxy";

import base from "./_base";

type Ctor = typeof ImageCanvas;

export default {
	type: "ImageCanvasSource",
	Constructor: ImageCanvas,
	optionMap: {
		...base.optionMap,
	},
	initialOptionMap: {
		...base.initialOptionMap,
		canvasFunction: "canvasFunction",
		logo: "logo",
		projection: "projection",
		ratio: "ratio",
		resolutions: "resolutions",
		state: "state",
	},
} satisfies Definition<Ctor>;
