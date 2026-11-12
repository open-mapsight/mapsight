import type {AnimationOptions, FitOptions} from "ol/View";
import type {Coordinate} from "ol/coordinate";
import type {Extent} from "ol/extent";
import type {SimpleGeometry} from "ol/geom";

import {removeKey, set, setAll, unset, withPath} from "@/lib/base/actions";
import type {
	ViewChangeDirection,
	ViewportAnchor,
} from "@/lib/map/lib/WithAnchoredViewport";
import type {InteractionsSelections, LayerStyleState} from "@/lib/map/types";
import type {FeatureId} from "@/types";

export const UPDATE_SIZE = "MAPSIGHT_MAP_UPDATE_SIZE";
export const ANIMATE = "MAPSIGHT_MAP_ANIMATE";
export const FIT_MAP_VIEW_TO_LAYER_SOURCE_EXTENT =
	"MAPSIGHT_MAP_FIT_MAP_VIEW_TO_LAYER_SOURCE_EXTENT";
export const FIT_MAP_VIEW_TO_LAYER_FEATURE =
	"MAPSIGHT_MAP_FIT_MAP_VIEW_TO_LAYER_FEATURE";

export const setViewportAnchor = (
	controllerName: string,
	viewportAnchor: ViewportAnchor,
) => set([controllerName, "viewportAnchor"], viewportAnchor);

export const updateMapSize = (
	controllerName: string,
	options: {
		from?: ViewChangeDirection | null;
		to?: ViewChangeDirection | null;
		reCenter?: boolean;
	} = {},
) =>
	withPath(
		{
			type: UPDATE_SIZE,
			from: options.from ?? null,
			to: options.to ?? null,
			reCenter: options.reCenter ?? true,
		},
		[controllerName],
	);

export const animate = (
	controllerName: string,
	options:
		AnimationOptions | ({bounds: SimpleGeometry | Extent} & FitOptions),
) =>
	withPath(
		{
			type: ANIMATE,
			options: options,
		},
		[controllerName],
	);

export const fitMapViewToLayerSourceExtent = (
	controllerName: string,
	layerId: string,
	options?: FitOptions,
) =>
	withPath(
		{
			type: FIT_MAP_VIEW_TO_LAYER_SOURCE_EXTENT,
			options: options,
		},
		[controllerName, "layers", layerId],
	);

export const fitMapViewToLayerFeature = (
	controllerName: string,
	layerId: string,
	featureId: FeatureId,
	options?: FitOptions,
) =>
	withPath(
		{
			type: FIT_MAP_VIEW_TO_LAYER_FEATURE,
			featureId: featureId,
			options: options,
		},
		[controllerName, "layers", layerId],
	);

export const setViewZoomAndResolution = (
	controllerName: string,
	zoom: number,
	resolution: number,
) =>
	setAll([controllerName, "view"], {
		zoom: Math.round(zoom),
		resolution: resolution,
	});

export const setMapSizeAfterUpdate = (
	controllerName: string,
	size: [number, number],
) =>
	setAll([controllerName], {
		size,
		pendingUpdateSize: false,
	});

export const setViewCenter = (controllerName: string, viewCenter: Coordinate) =>
	set([controllerName, "view", "center"], viewCenter);
export const setViewRotation = (controllerName: string, viewRotation: number) =>
	set([controllerName, "view", "rotation"], viewRotation);
export const setViewMaxResolution = (
	controllerName: string,
	maxResolution: number,
) => set([controllerName, "view", "maxResolution"], maxResolution);
export const setViewMinResolution = (
	controllerName: string,
	minResolution: number,
) => set([controllerName, "view", "minResolution"], minResolution);

export const setLayerVisibility = (
	controllerName: string,
	layer: string,
	visibility: boolean,
) => set([controllerName, "layers", layer, "options", "visible"], visibility);

/**
 * Remove a layer definition from the map state at runtime, deleting its key
 * from `layers`. The controller then removes the OpenLayers layer from the map.
 *
 * Only the layer is removed:
 * - Its feature source stays in the feature sources state, because a source can
 *   feed several layers or a feature list. Remove it with `removeFeatureSource`
 *   once nothing uses it.
 * - Feature selections (highlight, preselect, select) are not touched. Clear
 *   them first if they refer to features of this layer.
 *
 * The layer's vector source is torn down with the layer: it stops observing the
 * feature source, the selections and the map size, so it no longer reacts to
 * later data or selection changes (for example by fitting the map). Other layers
 * on the same feature source keep working.
 *
 * Layers whose `metaData.visibleWhenLayerIds` lists the removed layer count it
 * as hidden and become invisible. Unknown ids are ignored.
 */
export const removeLayer = (controllerName: string, layerId: string) =>
	removeKey([controllerName, "layers", layerId]);

export const setLayerStyle = (
	controllerName: string,
	layer: string,
	style: LayerStyleState,
) => set([controllerName, "layers", layer, "options", "style"], style);

export const setMapCursor = (
	controllerName: string,
	cursorName: string | null,
) => set([controllerName, "cursor"], cursorName);

export const setInteractionStatus = (
	controllerName: string,
	interactionName: string,
	status: boolean,
) =>
	set(
		[controllerName, "interactions", interactionName, "options", "active"],
		status,
	);

export const activateInteraction = (
	controllerName: string,
	interactionName: string,
) => setInteractionStatus(controllerName, interactionName, true);

export const deactivateInteraction = (
	controllerName: string,
	interactionName: string,
) => setInteractionStatus(controllerName, interactionName, false);

export const addInteractionSelection = (
	controllerName: string,
	layerName: string,
	interaction: string,
	selectionId: string,
) =>
	set(
		[
			controllerName,
			"layers",
			layerName,
			"options",
			"selections",
			interaction,
		],
		selectionId,
	);

export const removeInteractionSelection = (
	controllerName: string,
	layerName: string,
	interaction: string,
) =>
	unset([
		controllerName,
		"layers",
		layerName,
		"options",
		"selections",
		interaction,
	]);

export const setInteractionSelections = (
	controllerName: string,
	layerName: string,
	interactionSelections: InteractionsSelections,
) =>
	set(
		[controllerName, "layers", layerName, "options", "selections"],
		interactionSelections,
	);
