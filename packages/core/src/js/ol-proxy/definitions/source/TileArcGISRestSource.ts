import TileArcGISRest from "ol/source/TileArcGISRest";

import type {Definition} from "@/ol-proxy";

import base from "./TileImageSource";

type Ctor = typeof TileArcGISRest;

export default {
	type: "TileArcGISRestSource",
	Constructor: TileArcGISRest,
	optionMap: {...base.optionMap, params: "updateParams"},
	initialOptionMap: {...base.initialOptionMap, params: "params"},
} satisfies Definition<Ctor>;
