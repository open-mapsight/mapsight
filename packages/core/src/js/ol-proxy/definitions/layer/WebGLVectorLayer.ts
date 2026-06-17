import WebGLVectorLayer from "ol/layer/WebGLVector";
import type {FlatStyleLike, StyleVariables} from "ol/style/flat";

import type {
	Definition,
	InitialOptionMapMapper,
	OptionMapMapper,
} from "@/ol-proxy";
import {OPTION_SET} from "@/ol-proxy";

import {createVectorLayerSourceOptionMapper} from "./VectorLayer";
import base from "./_base";

type Ctor = typeof WebGLVectorLayer;

const createWebGLStyleInitialOptionMapper =
	(): InitialOptionMapMapper<Ctor> =>
	({value}) => ({style: value});

const createWebGLStyleOptionMapper =
	(): OptionMapMapper<Ctor> => (layer, _name, _oldValue, newValue) => {
		layer.setStyle(newValue as FlatStyleLike);
	};

const createWebGLStyleVariablesOptionMapper =
	(): OptionMapMapper<Ctor> => (layer, _name, _oldValue, newValue) => {
		layer.updateStyleVariables(newValue as StyleVariables);
	};

export default {
	type: "WebGLVectorLayer",
	Constructor: WebGLVectorLayer,
	events: {
		beforeCreation(options) {
			if (!options?.style) {
				throw new Error(
					"WebGLVectorLayer requires options.webglStyle. Mapsight style functions return OpenLayers Style objects and cannot be used by the WebGL renderer.",
				);
			}
		},
	},
	optionMap: {
		...base.optionMap,
		source: createVectorLayerSourceOptionMapper() as OptionMapMapper<Ctor>,
		webglStyle: createWebGLStyleOptionMapper(),
		styleVariables: createWebGLStyleVariablesOptionMapper(),
		disableHitDetection: OPTION_SET,
	},
	initialOptionMap: {
		...base.initialOptionMap,
		webglStyle: createWebGLStyleInitialOptionMapper(),
		styleVariables: "variables",
		disableHitDetection: "disableHitDetection",
	},
} satisfies Definition<Ctor>;
