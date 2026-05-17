import {type MapsightStyleFunctionEnv} from "@mapsight/lib-ol/style/styleFunction";

import type {MapController} from "@/lib/map/controller";
import DrawInteraction from "@/lib/map/lib/DrawInteraction";
import type {Definition, Description} from "@/ol-proxy";
import {di, isDescription, updateProxyObject} from "@/ol-proxy";

function createOrUpdateSource(
	interaction: DrawInteraction,
	oldDefinition: undefined | Description,
	newDefinition: Description,
	mapController: MapController,
) {
	updateProxyObject({
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
			interaction.setSource(source);
		},
	});
}

type Ctor = typeof DrawInteraction;

export default {
	type: "DrawInteraction",
	Constructor: DrawInteraction,
	eventMap: ["drawend", "drawstart"],
	optionMap: {
		//type: (interaction, _, __, newDefinition) => interaction.setType(newDefinition),
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
		measure: "setMeasure",
		active: "setActive",
		replacePrevious: "setReplacePrevious",
		clearOnStart: "setClearOnStart",
		// TODO: condition
		// TODO: finishCondition
		// TODO: freehandCondition
		// TODO: geometryFunction
	},
	initialOptionMap: {
		type: "type",
		clickTolerance: "clickTolerance",
		dragVertexDelay: "dragVertexDelay",
		freehand: "freehand",
		//geometryName: 'geometryName', fixed
		maxPoints: "maxPoints",
		minPoints: "minPoints",
		snapTolerance: "snapTolerance",
		stopClick: "stopClick",
		wrapX: "wrapX",
	},
} satisfies Definition<Ctor, MapController>;
