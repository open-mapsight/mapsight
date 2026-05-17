import TileWMSSource from "ol/source/TileWMS";

import type {Definition} from "@/ol-proxy";
import {OPTION_SET} from "@/ol-proxy";

import TileImageSource from "./TileImageSource";

type Ctor = typeof TileWMSSource;

export default {
	type: "TileWMSSource",
	Constructor: TileWMSSource,
	optionMap: {
		...TileImageSource.optionMap,
		cacheSize: OPTION_SET,
		crossOrigin: OPTION_SET,
		gutter: OPTION_SET,
		hidpi: OPTION_SET,
		logo: OPTION_SET,
		tileClass: OPTION_SET,
		tileGrid: OPTION_SET,
		reprojectionErrorThreshold: OPTION_SET,
		serverType: OPTION_SET,
		wrapX: OPTION_SET,
		transition: OPTION_SET,
	},
	initialOptionMap: {
		...TileImageSource.initialOptionMap,
		params: "params",
	},
} satisfies Definition<Ctor>;
