import DragAndDrop from "ol/interaction/DragAndDrop";

import type {Definition} from "@/ol-proxy";
import {createDependencyMapper, di} from "@/ol-proxy";

import base from "./_base";

type Ctor = typeof DragAndDrop;

export default {
	type: "DragAndDropInteraction",
	Constructor: DragAndDrop,
	optionMap: {
		...base.optionMap,
	},
	initialOptionMap: {
		...base.initialOptionMap,
		projection: "projection",
		target: "target", // TODO: dom element
		// TODO: formatConstructors  createDependencyMapper(di, 'format'),
		source: createDependencyMapper(di, "source"),
	},
} satisfies Definition<Ctor>;
