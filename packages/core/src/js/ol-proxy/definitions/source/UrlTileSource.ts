import UrlTile from "ol/source/UrlTile";

import type {Definition} from "@/ol-proxy";

import base from "./_base";

type Ctor = typeof UrlTile;

export default {
	type: "UrlTileSource",
	Constructor: UrlTile,
	optionMap: {
		...base.optionMap,
		url: "setUrl",
		urls: "setUrls",
		tileLoadFunction: "setTileLoadFunction",
		tileUrlFunction: "setTileUrlFunction",
	},
	initialOptionMap: {
		...base.initialOptionMap,
		url: "url",
		urls: "urls",
		tileLoadFunction: "tileLoadFunction",
		tileUrlFunction: "tileUrlFunction",
	},
} satisfies Definition<Ctor>;
