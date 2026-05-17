import type {MapController} from "@/lib/map/controller";
import TranslateInteraction from "@/lib/map/lib/TranslateInteraction";
import type {VectorFeatureSource} from "@/lib/map/lib/VectorFeatureSource";
import type {Definition, Description} from "@/ol-proxy";
import {
	INITIAL_OPTION_PASS,
	OPTION_COLLECTION,
	di,
	isDescription,
	updateProxyObject,
} from "@/ol-proxy";
import base from "@/ol-proxy/definitions/interaction/PointerInteraction";

function createOrUpdateSource(
	interaction: TranslateInteraction,
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

type Ctor = typeof TranslateInteraction;

export default {
	type: "TranslateInteraction",
	Constructor: TranslateInteraction,
	optionMap: {
		...base.optionMap,
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
		active: "setActive",
	},
	initialOptionMap: {
		...base.initialOptionMap,
		source: INITIAL_OPTION_PASS,
		hitTolerance: true,
	},
} satisfies Definition<Ctor, MapController>;
