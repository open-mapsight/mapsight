import VectorTileLayer from "ol/layer/VectorTile";

import type {Definition, OptionMapMapper} from "@/ol-proxy";

import VectorLayerDef, {
	createVectorLayerSourceOptionMapper,
	createVectorLayerStyleOptionMapper,
} from "./VectorLayer";

type Ctor = typeof VectorTileLayer;

export default {
	type: "VectorTileLayer",
	Constructor: VectorTileLayer,
	optionMap: {
		...VectorLayerDef.optionMap,
		source: createVectorLayerSourceOptionMapper() as OptionMapMapper<Ctor>,
		style: createVectorLayerStyleOptionMapper() as OptionMapMapper<Ctor>,
	},
	initialOptionMap: {
		...VectorLayerDef.initialOptionMap,
	},
} satisfies Definition<Ctor>;
