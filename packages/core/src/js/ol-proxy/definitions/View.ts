import View from "ol/View";

import type {Definition} from "..";

type Ctor = typeof View;

export default {
	type: "View",
	Constructor: View,
	optionMap: {
		center: "setCenter",
		maxZoom: "setMaxZoom",
		minZoom: "setMinZoom",
		properties: "setProperties",
		resolution: "setResolution",
		rotation: "setRotation",
		zoom: "setZoom",
	},
	initialOptionMap: {
		extent: "extent",
		center: "center",
		maxZoom: "maxZoom",
		minZoom: "minZoom",
		properties: "properties",
		resolution: "resolution",
		rotation: "rotation",
		zoom: "zoom",
	},
} satisfies Definition<Ctor>;
