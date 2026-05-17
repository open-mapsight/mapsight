import type {MapsightStyleFunctionEnv} from "@mapsight/lib-ol/style/styleFunction";

import type {MapController} from "@/lib/map/controller";
import ModifyInteraction from "@/lib/map/lib/ModifyInteraction";
import type {VectorFeatureSource} from "@/lib/map/lib/VectorFeatureSource";
import type {Definition, Description} from "@/ol-proxy";
import {
	INITIAL_OPTION_PASS,
	OPTION_COLLECTION,
	di,
	isDescription,
	updateProxyObject,
} from "@/ol-proxy";
import PointerInteraction from "@/ol-proxy/definitions/interaction/PointerInteraction";

function createOrUpdateSource(
	interaction: ModifyInteraction,
	oldDefinition: undefined | Description,
	newDefinition: Description,
	mapController: MapController,
) {
	updateProxyObject<VectorFeatureSource>({
		di,
		oldObject: interaction.getSource() ?? undefined,
		oldDefinition,
		newDefinition,
		parentObject: interaction,
		remover: () => {
			interaction.setSource(null);
		},
		adder: (source) => {
			if (source?.setMapController) {
				source?.setMapController(mapController);
			}
			if (source?.setActive) {
				source?.setActive(true);
			}
			interaction.setSource(source);
		},
	});
}

type Ctor = typeof ModifyInteraction;

export default {
	type: "ModifyInteraction",
	Constructor: ModifyInteraction,
	optionMap: {
		...PointerInteraction.optionMap,
		features: OPTION_COLLECTION,
		source: (
			interaction,
			_name,
			oldDefinition,
			newDefinition,
			{parentObject: mapController},
		) => {
			if (!isDescription(newDefinition)) {
				// TODO: Should we log an error here?
				return;
			}

			createOrUpdateSource(
				interaction,
				isDescription(oldDefinition) ? oldDefinition : undefined,
				newDefinition,
				mapController,
			);
		},
		style: (
			interaction,
			_name,
			_oldValue,
			style,
			{parentObject: mapController},
		) => {
			const styleFunction = mapController.createStyleFunction(
				typeof style === "string"
					? {style: style}
					: (style as MapsightStyleFunctionEnv),
			);
			interaction.setStyle(styleFunction);
		},
		active: "setActive",
	},
	initialOptionMap: {
		...PointerInteraction.initialOptionMap,
		source: INITIAL_OPTION_PASS,
		condition: true, // TODO function
		deleteCondition: true, // TODO function
		insertVertexCondition: true, // TODO function
		pixelTolerance: true,
		wrapX: true,
	},
} satisfies Definition<Ctor, MapController>;
