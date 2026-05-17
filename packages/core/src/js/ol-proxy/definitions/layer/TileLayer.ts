import TileLayer from "ol/layer/Tile";

import type {Definition} from "@/ol-proxy";
import {di, isDescription, updateProxyObject} from "@/ol-proxy";

import base from "./_base";

type Ctor = typeof TileLayer;

export default {
	type: "TileLayer",
	Constructor: TileLayer,
	optionMap: {
		...base.optionMap,
		source(layer, _name, oldDefinition, newDefinition) {
			if (!isDescription(newDefinition)) {
				// TODO: Should we log an error here?
				return;
			}

			updateProxyObject({
				di,
				oldObject: layer.getSource() ?? undefined,
				oldDefinition: isDescription(oldDefinition)
					? oldDefinition
					: undefined,
				newDefinition,
				parentObject: layer,
				adder: (obj) => layer.setSource(obj),
			});
		},
		preload: "setPreload",
		useInterimTilesOnError: "setUseInterimTilesOnError",
	},
	initialOptionMap: {
		...base.initialOptionMap,
		preload: "preload",
		useInterimTilesOnError: "useInterimTilesOnError",
	},
} satisfies Definition<Ctor>;
