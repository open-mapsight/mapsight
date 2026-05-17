import VectorLayer from "ol/layer/Vector";

import type {MapsightStyleFunctionEnv} from "@mapsight/lib-ol/style/styleFunction";

import type {MapController} from "@/lib/map/controller";
import type {Definition, OlConstructor, OptionMapMapper} from "@/ol-proxy";
import {OPTION_SET, di, isDescription, updateProxyObject} from "@/ol-proxy";

import base from "./_base";

type VectorLayerCtor = typeof VectorLayer;

export function createVectorLayerSourceOptionMapper<
	TLayerCtor extends OlConstructor = VectorLayerCtor,
>(): OptionMapMapper<TLayerCtor, TLayerCtor> {
	return (layer, _name, oldDefinition, newDefinition) => {
		if (oldDefinition !== undefined && !isDescription(oldDefinition)) {
			// TODO: Should we log an error here?
			return;
		}

		if (!isDescription(newDefinition)) {
			// TODO: Should we log an error here?
			return;
		}

		updateProxyObject({
			di,
			oldObject: layer.getSource(),
			oldDefinition: oldDefinition,
			newDefinition: newDefinition,
			parentObject: layer,
			remover: () => layer.setSource(null),
			adder: (source) => {
				if (source.setLayer) {
					source.setLayer(layer);
				}
				layer.setSource(source);
			},
		});
	};
}

export function createVectorLayerStyleOptionMapper<
	TLayerCtor extends OlConstructor = VectorLayerCtor,
>(): OptionMapMapper<TLayerCtor, MapController> {
	return (layer, _, __, style, {parentObject: mapController}) => {
		const styleEnv =
			typeof style === "string"
				? {style: style}
				: (style as MapsightStyleFunctionEnv);
		const styleFunction = mapController.createStyleFunction(styleEnv);
		layer.setStyle(styleFunction);
	};
}

export default {
	type: "VectorLayer",
	Constructor: VectorLayer,
	optionMap: {
		...base.optionMap,
		source: createVectorLayerSourceOptionMapper() as OptionMapMapper<VectorLayerCtor>,
		style: createVectorLayerStyleOptionMapper() as OptionMapMapper<VectorLayerCtor>,
		styleFunction: "setStyle",
		preload: "setPreload",
		renderBuffer: OPTION_SET,
		renderOrder: OPTION_SET,
		useInterimTilesOnError: "setUseInterimTilesOnError",
	},
	initialOptionMap: {
		...base.initialOptionMap,
		preload: "preload",
		styleFunction: "style",
		renderBuffer: "renderBuffer",
		renderMode: "renderMode",
		renderOrder: "renderOrder",
		declutter: "declutter",
		updateWhileAnimating: "updateWhileAnimating",
		updateWhileInteracting: "updateWhileInteracting",
		useInterimTilesOnError: "useInterimTilesOnError",
	},
} satisfies Definition<VectorLayerCtor>;
