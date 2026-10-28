import type OlMap from "ol/Map";
import LineString from "ol/geom/LineString";
import Draw from "ol/interaction/Draw";
import type VectorSource from "ol/source/Vector";

import {createSelector} from "@reduxjs/toolkit";

import {mergeAll} from "@mapsight/core/lib/base/actions";
import {createFilteredFeatureSourceSelector} from "@mapsight/core/lib/feature-sources/selectors";
import {
	activateInteraction,
	deactivateInteraction,
} from "@mapsight/core/lib/map/actions";
import type {MapController} from "@mapsight/core/lib/map/controller";
import {
	DEFAULT_DISPLAY_STYLE,
	DEFAULT_PROJECTION,
} from "@mapsight/core/mixins/EditorMixin";
import type {Definition} from "@mapsight/core/ol-proxy";
import {OPTION_SET, di} from "@mapsight/core/ol-proxy";
import DrawInteraction from "@mapsight/core/ol-proxy/definitions/interaction/DrawInteraction";
import type {EnhancedStore} from "@mapsight/core/types";

import {observeState} from "@mapsight/lib-redux/observe-state";

import {
	FEATURE_SELECTIONS,
	FEATURE_SOURCES,
	MAP,
} from "../../config/constants/controllers";
import {getDictionary} from "../../helpers/i18n";
import {bindMapTargetKeyboard} from "../../helpers/map-target-keyboard";
import type {PluginInstance} from "../../types";

export const createActivateAction = (mapController: string, name: string) =>
	activateInteraction(mapController, `${name}_drawInteraction`);
export const createDeactivateAction = (mapController: string, name: string) =>
	deactivateInteraction(mapController, `${name}_drawInteraction`);

/** Add a tool identifier while preserving custom definitions and event names. */
export function keyboardDrawingDefinition(definition: Definition): Definition {
	return {
		...definition,
		optionMap: {...definition.optionMap, keyboardTool: OPTION_SET},
	};
}

export function getKeyboardDraw(map: OlMap, name: string): Draw | undefined {
	return map
		.getInteractions()
		.getArray()
		.find(
			(interaction): interaction is Draw =>
				interaction instanceof Draw &&
				interaction.get("keyboardTool") === name,
		);
}

function vertexCount(draw: Draw): number {
	const source = draw.getOverlay().getSource() as VectorSource | null;
	const line = source
		?.getFeatures()
		.find((feature) => feature.getGeometry() instanceof LineString)
		?.getGeometry();
	// The last sketch coordinate follows the pointer and is not a fixed vertex.
	return line instanceof LineString ? line.getCoordinates().length - 1 : 0;
}

export function finishKeyboardMeasurement(map: OlMap, name: string): void {
	const draw = getKeyboardDraw(map, name);
	if (draw?.getActive() && vertexCount(draw) >= 2) {
		draw.finishDrawing();
	}
}

/** Bind to the OL target lifecycle, including unmount/remount. Arrow keys stay with OL. */
export function installKeyboardDrawing(
	map: OlMap,
	name: string,
	pointActions?: {add: () => void; remove: () => void},
): () => void {
	if (typeof document === "undefined") return () => {};
	const keyboard = bindMapTargetKeyboard(map, {
		crosshairClass: "ms3-map-target--keyboard-drawing",
		showCrosshair: () =>
			map
				.getInteractions()
				.getArray()
				.some(
					(interaction) =>
						interaction instanceof Draw &&
						interaction.get("keyboardTool") &&
						interaction.getActive(),
				),
		isActive: () => Boolean(getKeyboardDraw(map, name)?.getActive()),
		onKey({key}) {
			if (!["Enter", " ", "Backspace"].includes(key)) return undefined;
			// Runs once a keyboard pan ends; the tool may have closed meanwhile.
			return () => {
				const draw = getKeyboardDraw(map, name);
				if (!draw?.getActive()) return;
				if (key === "Backspace") {
					if (pointActions) pointActions.remove();
					else draw.removeLastPoint();
				} else if (pointActions) {
					pointActions.add();
				} else if (key === "Enter" && vertexCount(draw) >= 2) {
					draw.finishDrawing();
				} else {
					const center = map.getView().getCenter();
					if (center) draw.appendCoordinates([center.slice()]);
				}
			};
		},
	});
	let observedDraw: Draw | undefined;
	const watchDraw = () => {
		observedDraw?.un("change:active", keyboard.update);
		observedDraw = getKeyboardDraw(map, name);
		observedDraw?.on("change:active", keyboard.update);
		keyboard.update();
	};
	map.getInteractions().on("add", watchDraw);
	map.getInteractions().on("remove", watchDraw);
	watchDraw();
	return () => {
		keyboard.dispose();
		map.getInteractions().un("add", watchDraw);
		map.getInteractions().un("remove", watchDraw);
		observedDraw?.un("change:active", keyboard.update);
	};
}

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
	zIndex,
	interactionType,
	keyboardDrawing,
}: {
	store: EnhancedStore;
	name: string;
	featureSourcesControllerName: string;
	featureSelectionsControllerName: string;
	mapControllerName: string;
	drawStyle: string;
	displayStyle: string;
	zIndex?: number;
	interactionType: string;
	keyboardDrawing: boolean;
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
						type: interactionType,
						options: {
							active: false,
							keyboardTool: keyboardDrawing ? name : undefined,
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
							...(zIndex !== undefined ? {zIndex} : {}),
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
		"ui.measure-distance.keyboard-instructions":
			"Klicken Sie auf die Karte, um Punkte zu setzen. Doppelklick oder „Fertig“ beendet die Strecke.",
		"ui.measure-distance.keyboard-instructions-done":
			"Klicken Sie auf die Karte, um eine neue Strecke zu messen.",
		"ui.measure-distance.measurement": "Streckenlänge",
	},
	en: {
		"ui.measure-distance.title": "Measure distance",
		"ui.measure-distance.instructions":
			"Click on the map to add points. Double click to end the line.",
		"ui.measure-distance.instructions-done":
			"Click on the map to start measuring a new line.",
		"ui.measure-distance.keyboard-instructions":
			"Click the map to add points. Double-click or “Done” finishes the line.",
		"ui.measure-distance.keyboard-instructions-done":
			"Click the map to measure a new line.",
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
		/** Draw at the view centre with the keyboard. @default false */
		keyboardDrawing?: boolean;
		mapControllerName?: string;
		featureSourcesControllerName?: string;
		featureSelectionsControllerName?: string;
		displayStyle?: string;
		drawStyle?: string;
		drawInteraction?: Definition | null;
		zIndex?: number;
	} = {},
): PluginInstance {
	const {
		name = "measureDistance",
		enableDrawing = true,
		keyboardDrawing = false,
		mapControllerName = MAP,
		featureSourcesControllerName = FEATURE_SOURCES,
		featureSelectionsControllerName = FEATURE_SELECTIONS,
		displayStyle = DEFAULT_DISPLAY_STYLE,
		drawStyle = "drawMeasure",
		drawInteraction = DrawInteraction,
		zIndex,
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

			const definition =
				drawInteraction && keyboardDrawing
					? keyboardDrawingDefinition(drawInteraction)
					: drawInteraction;
			if (definition) {
				di.injectDefinitions([definition]);
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
				zIndex,
				interactionType: definition?.type ?? "DrawInteraction",
				keyboardDrawing,
			});
			const map = (
				store.getController(mapControllerName) as MapController
			).getMap();
			if (keyboardDrawing && map) installKeyboardDrawing(map, name);
		},
	};
}
