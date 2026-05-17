import proj4 from "proj4";
import {createSelector} from "reselect";

import {mergeAll, set} from "@mapsight/core/lib/base/actions";
import {createFilteredFeatureSourceSelector} from "@mapsight/core/lib/feature-sources/selectors";
import {
	activateInteraction,
	deactivateInteraction,
} from "@mapsight/core/lib/map/actions";
import {
	DEFAULT_DISPLAY_STYLE,
	DEFAULT_DRAW_STYLE,
	DEFAULT_PROJECTION,
} from "@mapsight/core/mixins/EditorMixin";
import type {Definition} from "@mapsight/core/ol-proxy";
import {di} from "@mapsight/core/ol-proxy";
import DrawInteraction from "@mapsight/core/ol-proxy/definitions/interaction/DrawInteraction";

import {observeState} from "@mapsight/lib-redux/observe-state";

import {mapViewCenter} from "../../config";
import {
	FEATURE_SELECTIONS,
	FEATURE_SOURCES,
	MAP,
} from "../../config/constants/controllers";
import {features, metaData} from "../../config/map/layers";
import {translate} from "../../helpers/i18n";
import type {PluginInstance} from "../../types.ts";

export const createActivateAction = (mapController, name) =>
	activateInteraction(mapController, `${name}_drawInteraction`);
export const createDeactivateAction = (mapController, name) =>
	deactivateInteraction(mapController, `${name}_drawInteraction`);

function geoJsonPointToMapViewCoordinates(pointGeometry): [number, number] {
	return proj4(DEFAULT_PROJECTION, "EPSG:3857", pointGeometry.coordinates);
}

/**
 * @param {object} options options
 * @param {import('redux').Store} options.store store
 * @param {string} options.name name name of the editor (must be unique per mapsight instance)
 * @param {string} options.mapControllerName map controller name
 * @param {string} options.featureSourcesControllerName feature sources controller name
 * @param {string} options.featureSelectionsControllerName feature selections controller name
 * @param {string} options.displayStyle style for finished draw
 * @param {string} options.drawStyle style while drawing
 */
function setupDrawInteraction({
	store,
	name,
	featureSourcesControllerName,
	featureSelectionsControllerName,
	mapControllerName,
	drawStyle,
	displayStyle,
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
							type: "Point",
							style: drawStyle,
							replacePrevious: true,
							clearOnStart: true,
							source: vFS,
							stopClick: true,
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
		if (createdFeatures?.length) {
			const feature = createdFeatures[0];

			if (feature?.geometry?.type === "Point") {
				store.dispatch(deactivate);
			}
		}
	});
}

export type MarkerPoint = {
	type: "Point";
	coordinates: [number, number] | [number, number, number];
};

export type MarkerProps = {
	id: import("../../types").MapsightUiFeatureId;
	name: string;
	iconId: string;
};

export type MarkerFeatureFactory = (
	a: MarkerPoint,
	b: MarkerProps,
) => import("../../types").MapsightUiFeature;

/**
 * @type {MarkerFeatureFactory}
 */
function defaultCreateMarkerFeature(
	point,
	{id = "link-marker", name = "Marker", iconId = "marker"},
) {
	return /** @type {import('../../types').MapsightUiFeature} */ {
		type: "Feature",
		geometry: point,
		id: id,
		properties: {
			id: id,
			name: name,
			mapsightIconId: iconId,
		},
	};
}

/**
 * @param {object} options options
 * @param {import('redux').Store} options.store store
 * @param {string} options.name name name of the editor (must be unique per mapsight instance)
 * @param {string} options.mapControllerName map controller name
 * @param {string} options.featureSourcesControllerName feature sources controller name
 * @param {string} options.linkParameter link parameter name
 * @param {boolean} options.centerOnMarker centers map on marker if present
 * @param {string} options.markerStyle style for marker
 * @param {number|null} options.markerZoom zoom level when marker is present
 * @param {import('../../types').MapsightUiFeatureId} options.markerFeatureId feature id
 * @param {string} options.markerName marker feature name
 * @param {string|null} options.markerLayerGroup marker layer group
 * @param {MarkerFeatureFactory} options.createMarkerFeature factory for marker feature
 */
function setupMarker(options) {
	const {
		store,
		name,
		linkParameter,
		mapControllerName,
		featureSourcesControllerName,
		markerStyle,
		centerOnMarker,
		markerZoom,
		markerFeatureId,
		markerName,
		markerLayerGroup,
		markerIconId,
		createMarkerFeature,
	} = options;

	const fSId = `${name}_markerFeatureSource`;
	const layerId = `${name}_markerLayer`;

	const regex = new RegExp(
		`[#&]${encodeURIComponent(
			linkParameter,
		)}=(\\d+(?:\\.\\d+)?)\\/(\\d+(?:\\.\\d+)?)(?:&|$)`,
		"",
	);

	// TODO: Handle on SSR?!
	// TODO: Handle on-page-navigation (on hashchange/pushState)
	const linkMarkerMatches =
		typeof window !== "undefined" && window.location?.hash.match(regex);
	if (!linkMarkerMatches) {
		return;
	}

	const [, lat, lon] = linkMarkerMatches;
	const point = {
		type: "Point",
		coordinates: [parseFloat(lon!), parseFloat(lat!)],
	};

	const feature = createMarkerFeature(point, {
		id: markerFeatureId,
		name: markerName,
		iconId: markerIconId,
	});

	store.dispatch(
		mergeAll({
			[mapControllerName]: {
				layers: {
					[layerId]: features(
						fSId,
						true,
						true,
						metaData(
							markerName,
							null,
							false,
							false,
							false,
							markerLayerGroup,
						),
						markerStyle,
					),
				},
			},
			[featureSourcesControllerName]: {
				[fSId]: {
					enableHistory: false,
					data: {
						type: "FeatureCollection",
						features: [feature],
					},
					ids: [feature.id],
				},
			},
		}),
	);

	if (centerOnMarker) {
		store.dispatch(
			set(
				[mapControllerName, "view", "center"],
				mapViewCenter(...geoJsonPointToMapViewCoordinates(point)),
			),
		);

		if (Number.isInteger(markerZoom)) {
			store.dispatch(
				set([mapControllerName, "view", "zoom"], markerZoom),
			);
		}
	}
}

export type Options = {
	/**
	 * name of the editor (must be unique per mapsight instance)
	 *
	 * @default "sharePositionLink"
	 */
	name?: string;

	/**
	 * map controller name
	 *
	 * @default "map"
	 */
	mapControllerName?: string;

	/**
	 * feature sources controller name
	 *
	 * @default "featureSources"
	 */
	featureSourcesControllerName?: string;
	/**
	 * feature selections controller name
	 *
	 * @default "featureSelections"
	 */
	featureSelectionsControllerName?: string;

	/**
	 * enable drawing
	 *
	 * @default true
	 */
	enableDrawing?: boolean;

	/**
	 * style for finished draw
	 *
	 * @default"features"
	 */
	displayStyle?: string;

	/**
	 * style while drawing
	 *
	 * @default "draw"
	 */
	drawStyle?: string;

	/**
	 * draw interaction
	 */
	drawInteraction?: Definition | null;

	/**
	 * link parameter name
	 *
	 * @default "lm"
	 */
	linkParameter?: string;

	/**
	 * show marker if link parameter is present
	 *
	 * @default true
	 */
	showMarker?: boolean;

	/**
	 * centers map on marker if present
	 *
	 * @default true
	 */
	centerOnMarker?: boolean;

	/**
	 * style for marker
	 *
	 * @default "features"
	 */
	markerStyle?: string;

	/**
	 * zoom level when marker is present
	 *
	 * @default 16
	 */
	markerZoom?: number | null;

	/**
	 *  marker feature id
	 */
	markerFeatureId?: import("../../types").MapsightUiFeatureId;
	/**
	 * marker feature name
	 *
	 * @default "marker"
	 */
	markerName?: string;

	/**
	 * marker layer group
	 *
	 * @default null
	 */
	markerLayerGroup?: string | null;

	/**
	 * factory for marker feature
	 */
	createMarkerFeature?: MarkerFeatureFactory;
};

/**
 * This plugin will allow drawing a link maker (to be used with the appropriate component)
 * and/or display such a marker.
 *
 * @param options options
 * @returns plugin
 */
export default function createShareLinkPlugin(
	options: Options = {},
): PluginInstance {
	const {
		name = "sharePositionLink",
		enableDrawing = true,
		mapControllerName = MAP,
		featureSourcesControllerName = FEATURE_SOURCES,
		featureSelectionsControllerName = FEATURE_SELECTIONS,
		displayStyle = DEFAULT_DISPLAY_STYLE,
		drawStyle = DEFAULT_DRAW_STYLE,
		drawInteraction = DrawInteraction,
		linkParameter = "lm",
		showMarker = true,
		centerOnMarker = true,
		markerStyle = DEFAULT_DISPLAY_STYLE,
		markerZoom = 16,
		markerFeatureId = "link-marker",
		markerName = translate("marker"),
		markerLayerGroup = null,
		createMarkerFeature = defaultCreateMarkerFeature,
	} = options;

	return {
		afterCreate({store}) {
			if (enableDrawing) {
				if (drawInteraction) {
					di.injectDefinitions([drawInteraction]);
				}

				setupDrawInteraction({
					name,
					store,
					mapControllerName,
					featureSourcesControllerName,
					featureSelectionsControllerName,
					drawStyle,
					displayStyle,
				});
			}

			if (showMarker) {
				setupMarker({
					name,
					store,
					mapControllerName,
					featureSourcesControllerName,

					linkParameter,
					centerOnMarker,
					markerStyle,
					markerZoom,
					markerFeatureId,
					markerName,
					markerLayerGroup,
					createMarkerFeature,
				});
			}
		},
	};
}
