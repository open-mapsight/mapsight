import Osm from "ol/source/OSM";

import type {Definition} from "@/ol-proxy";
import {OPTION_SET} from "@/ol-proxy";

import base from "./_base";

type Ctor = typeof Osm;

export default {
	type: "OsmSource",
	Constructor: Osm,
	optionMap: {
		...base.optionMap,
		cacheSize: OPTION_SET,
		crossOrigin: OPTION_SET,
		maxZoom: OPTION_SET,
		opaque: OPTION_SET,
		reprojectionErrorThreshold: OPTION_SET,
		wrapX: OPTION_SET,
		attributions: "setAttributions",
		properties: "setProperties",
		renderReprojectionEdges: "setRenderReprojectionEdges",
		tileGridForProjection: "setTileGridForProjection",
		tileLoadFunction: "setTileLoadFunction",
		tileUrlFunction: "setTileUrlFunction",
		url: "setUrl",
		urls: "setUrls",
	},
	initialOptionMap: {...base.initialOptionMap},
} satisfies Definition<Ctor>;
