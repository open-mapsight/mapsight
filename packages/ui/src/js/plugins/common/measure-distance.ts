import type {Store} from "@reduxjs/toolkit";
import {createSelector} from "@reduxjs/toolkit";

import {mergeAll} from "@mapsight/core/lib/base/actions";
import {createFilteredFeatureSourceSelector} from "@mapsight/core/lib/feature-sources/selectors";
import {
	activateInteraction,
	deactivateInteraction,
} from "@mapsight/core/lib/map/actions";
import {
	DEFAULT_DISPLAY_STYLE,
	DEFAULT_PROJECTION,
} from "@mapsight/core/mixins/EditorMixin";
import type {Definition} from "@mapsight/core/ol-proxy";
import {di} from "@mapsight/core/ol-proxy";
import DrawInteraction from "@mapsight/core/ol-proxy/definitions/interaction/DrawInteraction";

import {observeState} from "@mapsight/lib-redux/observe-state";

import {
	FEATURE_SELECTIONS,
	FEATURE_SOURCES,
	MAP,
} from "../../config/constants/controllers";
import {getDictionary} from "../../helpers/i18n";
import type {PluginInstance} from "../../types.ts";

export const createActivateAction = (mapController: string, name: string) =>
	activateInteraction(mapController, `${name}_drawInteraction`);
export const createDeactivateAction = (mapController: string, name: string) =>
	deactivateInteraction(mapController, `${name}_drawInteraction`);

/**
 * @param options options
 * @param options.store store
 * @param options.name name name of the editor (must be unique per mapsight instance)
 * @param options.mapControllerName map controller name
 * @param options.featureSourcesControllerName feature sources controller name
 * @param options.featureSelectionsControllerName feature selections controller name
 * @param options.displayStyle style for finished draw
 * @param options.drawStyle style while drawing
 */
function setupDrawInteraction({
	store,
	name,
	featureSourcesControllerName,
	featureSelectionsControllerName,
	mapControllerName,
	drawStyle,
	displayStyle,
}: {
	store: Store;
	name: string;
	featureSourcesControllerName: string;
	featureSelectionsControllerName: string;
	mapControllerName: string;
	drawStyle: string;
	displayStyle: string;
}) {
	const fSId = `${name}_featureSource`;
	const drawLayerId = `${name}_drawLayer`;
	const interactionId = `${name}_drawInteraction`;

	const vFS = {
		type: "VectorFeatureSource",
		options: {
			projection: DEFAULT_PROJECTION,
			featureSourceId: fSId,
			featureSourcesControllerName: featureSourcesControllerName,
			featureSelectionsControllerName: featureSelectionsControllerName,
			canAnimate: false,
			canCluster: false,
			featureSelections: [],
		},
	};

	store.dispatch(
		mergeAll({
			[mapControllerName]: {
				interactions: {
					[interactionId]: {
						type: "DrawInteraction",
						options: {
							active: false,
							type: "LineString",
							style: drawStyle,
							replacePrevious: true,
							clearOnStart: true,
							source: vFS,
							stopClick: true,
							measure: {
								active: true,
								keepLabel: true,
							},
						},
					},
				},
				layers: {
					[drawLayerId]: {
						type: "VectorLayer",
						options: {
							visible: true,
							style: displayStyle,
							renderBuffer: 200,
							selections: [],
							source: vFS,
						},
					},
				},
			},
			[featureSourcesControllerName]: {
				[fSId]: {
					enableHistory: false,
					data: {},
					isLoading: true,
				},
			},
		}),
	);

	const featuresSelector = createSelector(
		createFilteredFeatureSourceSelector(
			featureSourcesControllerName,
			fSId,
			mapControllerName,
		),
		(featureSourceState) => featureSourceState?.data?.features,
	);
	const deactivate = createDeactivateAction(mapControllerName, name);

	observeState(store, featuresSelector, (createdFeatures) => {
		if (createdFeatures?.[0]?.geometry?.type === "Point") {
			store.dispatch(deactivate);
		}
	});
}

const translations = {
	de: {
		"ui.measure-distance.title": "Strecke messen",
		"ui.measure-distance.instructions":
			"Klicken Sie auf die Karte um Punkte hinzuzufügen. Ein Doppelklick schließt die Strecke ab.",
		"ui.measure-distance.instructions-done":
			"Klicken Sie auf die Karte um eine neue Strecke zu messen.",
		"ui.measure-distance.measurement": "Streckenlänge",
	},
	en: {
		"ui.measure-distance.title": "Measure distance",
		"ui.measure-distance.instructions":
			"Click on the map to add points. Double click to end the line.",
		"ui.measure-distance.instructions-done":
			"Click on the map to start measuring a new line.",
		"ui.measure-distance.measurement": "Distance",
	},
} as const;

/**
 * This plugin will allow drawing a link maker (to be used with the appropriate component)
 * and/or display such a measurement.
 *
 * @param {object} [options] options
 * @param [options.name="measureDistance"] name name of the editor (must be unique per mapsight instance)
 * @param [options.mapControllerName="map"] map controller name
 * @param [options.featureSourcesControllerName="featureSources"] feature sources controller name
 * @param [options.featureSelectionsControllerName="featureSelections"] feature selections controller name
 * @param [options.enableDrawing=true] enable drawing
 * @param [options.displayStyle="features"] style for finished draw
 * @param [options.drawStyle="drawMeasure"] style while drawing
 * @param [options.drawInteraction] draw interaction
 * @returns {import('../../types').PluginInstance} plugin
 */
export default function createMeasureDistancePlugin(
	options: {
		name?: string;
		enableDrawing?: boolean;
		mapControllerName?: string;
		featureSourcesControllerName?: string;
		featureSelectionsControllerName?: string;
		displayStyle?: string;
		drawStyle?: string;
		drawInteraction?: Definition | null;
	} = {},
): PluginInstance {
	const {
		name = "measureDistance",
		enableDrawing = true,
		mapControllerName = MAP,
		featureSourcesControllerName = FEATURE_SOURCES,
		featureSelectionsControllerName = FEATURE_SELECTIONS,
		displayStyle = DEFAULT_DISPLAY_STYLE,
		drawStyle = "drawMeasure",
		drawInteraction = DrawInteraction,
	} = options;

	const dict = getDictionary();

	Object.entries(translations).forEach(([key, obj]) => {
		Object.assign((dict[key] ??= {}), obj);
	});

	return {
		afterCreate: function measureDistancePlugin({store}) {
			if (!enableDrawing || !store) {
				return;
			}

			if (drawInteraction) {
				di.injectDefinitions([drawInteraction]);
			}

			setupDrawInteraction({
				name: name,
				store: store,
				mapControllerName: mapControllerName,
				featureSourcesControllerName: featureSourcesControllerName,
				featureSelectionsControllerName:
					featureSelectionsControllerName,
				drawStyle: drawStyle,
				displayStyle: displayStyle,
			});
		},
	};
}
