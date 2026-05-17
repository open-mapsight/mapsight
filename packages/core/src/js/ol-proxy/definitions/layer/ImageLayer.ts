import ImageLayer from "ol/layer/Image";

import type {Definition} from "@/ol-proxy";
import {di, isDescription, updateProxyObject} from "@/ol-proxy";

import base from "./_base";

type Ctor = typeof ImageLayer;

export default {
	type: "ImageLayer",
	Constructor: ImageLayer,
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
				remover: () => layer.setSource(null),
				adder: (source) => {
					if (
						source &&
						"setLayer" in source &&
						typeof source.setLayer === "function"
					) {
						source.setLayer(layer);
					}
					layer.setSource(source);
				},
			});
		},
	},
	initialOptionMap: {...base.initialOptionMap},
} satisfies Definition<Ctor>;
