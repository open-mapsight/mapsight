import Extent from "ol/interaction/Extent";

import {type MapsightStyleFunctionEnv} from "@mapsight/lib-ol/style/styleFunction";

import type {MapController} from "@/lib/map/controller";
import type {Definition, InitialOptionMapMapper} from "@/ol-proxy";

import PointerInteraction from "./PointerInteraction";

const initStyle: InitialOptionMapMapper<typeof Extent, MapController> = ({
	value: style,
	parentObject: mapController,
}) => {
	const styleEnv =
		typeof style === "string"
			? {style: style}
			: (style as MapsightStyleFunctionEnv);
	const styleFunction = mapController.createStyleFunction(styleEnv);
	return {style: styleFunction};
};

type Ctor = typeof Extent;

export default {
	type: "ExtentInteraction",
	Constructor: Extent,
	optionMap: {...PointerInteraction.optionMap, extent: "setExtent"},
	initialOptionMap: {
		...PointerInteraction.initialOptionMap,
		boxStyle: initStyle as InitialOptionMapMapper<typeof Extent>,
		pointerStyle: initStyle as InitialOptionMapMapper<typeof Extent>,
		extent: "extent",
		pixelTolerance: "pixelTolerance",
		wrapX: "wrapX",
	},
} satisfies Definition<Ctor>;
