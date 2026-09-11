import {createSelector} from "@reduxjs/toolkit";
import proj4 from "proj4";

import {mergeAll, set} from "@mapsight/core/lib/base/actions";
import {setData} from "@mapsight/core/lib/feature-sources/actions";
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
import {translate} from "../../helpers/i18n";
import type {PluginInstance} from "../../types";
import {
	ensureMarkedPointLayerAction,
	markedPointCollection,
	markedPointSourceId,
} from "./marked-point";

export const createActivateAction = (mapController, name) =>
	activateInteraction(mapController, `${name}_drawInteraction`);
export const createDeactivateAction = (mapController, name) =>
	deactivateInteraction(mapController, `${name}_drawInteraction`);

function geoJsonPointToMapViewCoordinates(pointGeometry): [number, number] {
	return proj4(DEFAULT_PROJECTION, "EPSG:3857", pointGeometry.coordinates);
}

export function parseLinkMarkerHash(
	hash: string,
	linkParameter = "lm",
): {lat: number; lon: number} | null {
	const regex = new RegExp(
		`[#&]${encodeURIComponent(
			linkParameter,
		)}=(-?\\d+(?:\\.\\d+)?)\\/(-?\\d+(?:\\.\\d+)?)(?:&|$)`,
	);
	const match = hash.match(regex);
	if (!match) {
		return null;
	}
	const lat = Number.parseFloat(match[1]!);
	const lon = Number.parseFloat(match[2]!);
	if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
		return null;
	}
	return {lat, lon};
}

function applyCoordinatePrecision(value: number): string {
	if (!Number.isFinite(value)) {
		return "0";
	}
	return value
		.toFixed(6)
		.replace(/(\.\d*?)0+$/, "$1")
		.replace(/\.$/, "");
}

export function formatLinkMarkerHash(
	lat: number,
	lon: number,
	linkParameter = "lm",
): string {
	return `#${linkParameter}=${applyCoordinatePrecision(lat)}/${applyCoordinatePrecision(lon)}`;
}

export function buildLinkMarkerShareHref(
	lat: number,
	lon: number,
	location: {origin: string; pathname: string; search?: string},
	linkParameter = "lm",
): string {
	const url = new URL(
		`${location.origin}${location.pathname}${location.search ?? ""}`,
	);
	url.protocol = "https:";
	url.hash = formatLinkMarkerHash(lat, lon, linkParameter);
	return url.href;
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
}) {
	const fSId = markedPointSourceId(name);
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
			mapsightMarkedPoint: true,
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
		featureSelectionsControllerName,
		centerOnMarker,
		markerZoom,
		markerFeatureId,
		markerName,
		markerIconId,
		createMarkerFeature,
		markerStyle,
		markerLayerGroup,
		zIndex,
	} = options;

	// TODO: Handle on SSR?!
	// TODO: Handle on-page-navigation (on hashchange/pushState)
	const parsed =
		typeof window !== "undefined"
			? parseLinkMarkerHash(window.location?.hash ?? "", linkParameter)
			: null;
	if (!parsed) {
		return;
	}

	const point = {
		type: "Point",
		coordinates: [parsed.lon, parsed.lat],
	};

	const feature = createMarkerFeature(point, {
		id: markerFeatureId,
		name: markerName,
		iconId: markerIconId,
	});

	store.dispatch(
		ensureMarkedPointLayerAction({
			pluginName: name,
			mapControllerName,
			featureSourcesControllerName,
			featureSelectionsControllerName,
			markerName,
			markerStyle,
			markerLayerGroup,
			zIndex,
		}),
	);
	store.dispatch(
		setData(
			featureSourcesControllerName,
			markedPointSourceId(name),
			markedPointCollection(feature),
		),
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
	 * style for the shared marked-point layer when `markerStyle` is omitted
	 *
	 * @default "features"
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

	/**
	 * z-index for the draw and hash-marker layers
	 */
	zIndex?: number;
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
		markerStyle = displayStyle,
		markerZoom = 16,
		markerFeatureId = "link-marker",
		markerName = translate("marker"),
		markerLayerGroup = null,
		createMarkerFeature = defaultCreateMarkerFeature,
		zIndex,
	} = options;

	return {
		afterCreate({store}) {
			if (!store) {
				return;
			}
			store.dispatch(
				ensureMarkedPointLayerAction({
					pluginName: name,
					mapControllerName,
					featureSourcesControllerName,
					featureSelectionsControllerName,
					markerName,
					markerStyle,
					markerLayerGroup,
					zIndex,
				}),
			);

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
				});
			}

			if (showMarker) {
				setupMarker({
					name,
					store,
					mapControllerName,
					featureSourcesControllerName,
					featureSelectionsControllerName,
					linkParameter,
					centerOnMarker,
					markerStyle,
					markerZoom,
					markerFeatureId,
					markerName,
					markerLayerGroup,
					markerIconId: "marker",
					createMarkerFeature,
					zIndex,
				});
			}
		},
	};
}
