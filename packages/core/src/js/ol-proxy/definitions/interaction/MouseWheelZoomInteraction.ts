import MouseWheelZoom from "ol/interaction/MouseWheelZoom";

import type {Definition} from "@/ol-proxy";

import base from "./_base";

type Ctor = typeof MouseWheelZoom;

export default {
	type: "MouseWheelZoomInteraction",
	Constructor: MouseWheelZoom,
	optionMap: {
		...base.optionMap,
		useAnchor: "setMouseAnchor",
		mouseAnchor: "setMouseAnchor", // alias
	},
	initialOptionMap: {
		...base.initialOptionMap,
		duration: "duration",
		timeout: "timeout",
		constrainResolution: "constrainResolution",
		useAnchor: "useAnchor",
		mouseAnchor: "useAnchor", // alias
	},
} satisfies Definition<Ctor>;
