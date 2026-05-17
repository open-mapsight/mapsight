import Collection from "ol/Collection";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";

import type {Definition} from "@/ol-proxy";
import {OPTION_SKIP} from "@/ol-proxy";

import VectorLayerDef from "./VectorLayer";

type Ctor = typeof VectorLayer;

export default {
	type: "VectorOverlayLayer",
	Constructor: VectorLayer,
	events: {
		afterCreation(layer) {
			const source = new VectorSource({
				useSpatialIndex: false,
				features: new Collection([], {unique: true}),
			});
			layer.set("updateWhileAnimating", true);
			layer.set("updateWhileInteracting", true);
			layer.setSource(source);
			layer.setZIndex(1000); // TODO
		},
	},
	optionMap: {
		...VectorLayerDef.optionMap,
		source: OPTION_SKIP, // set by afterCreation event
		zIndex: OPTION_SKIP, // set by afterCreation event
	},
	initialOptionMap: {
		...VectorLayerDef.initialOptionMap,
		zIndex: OPTION_SKIP, // set by afterCreation event
	},
} satisfies Definition<Ctor>;
