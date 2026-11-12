import type {Extent} from "ol/extent";
import {getForViewAndSize} from "ol/extent";
import {fromUserCoordinate, getUserProjection, toUserExtent} from "ol/proj";

import type {Selector} from "@reduxjs/toolkit";
import {createSelector} from "@reduxjs/toolkit";
import isEqual from "lodash/isEqual";
import unique from "lodash/uniq";

import {isNonNullable, mapNonNullable} from "@mapsight/lib-js/nonNullable";
import reduceByKeys from "@mapsight/lib-redux/reducers/reduce-by-keys";

import type {
	FeatureSourceState,
	FeatureSourcesState,
} from "@/lib/feature-sources/types";
import type {FeatureInteractionName} from "@/lib/map/lib/WithFeatureInteractions";
import type {LayerState, MapState, MapViewState} from "@/lib/map/types";
import {isVectorFeatureSource} from "@/lib/map/types";
import type {State} from "@/types";

/**
 * select all layers from state
 */
export const layersSelector = (state: MapState) => state.layers;

export const makeLayerTitleSelector = (id: string) => (state: MapState) =>
	state.layers[id]?.metaData?.title ?? "";
export const makeLayerLockedInLayerSwitcherSelector =
	(id: string) => (state: MapState) =>
		state.layers[id]?.metaData?.lockedInLayerSwitcher ?? false;

export const makeLayerSelectionSelector =
	(id: string, interactionName: FeatureInteractionName) =>
	(state: MapState) =>
		state.layers[id]?.options?.selections?.[interactionName];

// Select the layers reference so view updates do not rebuild the ids. Reuse
// equal results when layer changes leave switcher membership and order intact.
export const layerIdsIntegratedSwitcherSelector: Selector<MapState, string[]> =
	createSelector(
		[layersSelector],
		(layers) =>
			layers
				? Object.keys(layers).filter(
						(id) => layers[id]?.metaData?.visibleInLayerSwitcher,
					)
				: [],
		{memoizeOptions: {resultEqualityCheck: isEqual}},
	);

export const layerIdsExternalSwitcherSelector: Selector<MapState, string[]> =
	createSelector(
		[layersSelector],
		(layers) =>
			layers
				? Object.keys(layers).filter(
						(id) =>
							layers[id]?.metaData
								?.visibleInExternalLayerSwitcher,
					)
				: [],
		{memoizeOptions: {resultEqualityCheck: isEqual}},
	);

export const makeLayerVisibleSelector =
	(layerId: string) => (state: MapState) =>
		state.layers[layerId]?.options?.visible ?? false;

export const makeFeatureSourceIdFromLayerIdSelector =
	(layerId: string) => (state: MapState) => {
		const source = state.layers[layerId]?.options?.source;
		if (!isVectorFeatureSource(source)) {
			return undefined;
		}
		return source.options.featureSourceId;
	};

export const makeFeatureSourceControllerNameFromLayerIdSelector =
	(layerId: string) => (state: MapState) => {
		const source = state.layers[layerId]?.options?.source;
		if (!isVectorFeatureSource(source)) {
			return undefined;
		}
		return source.options.featureSourcesControllerName;
	};

/**
 * create selector for featureState corresponding to the featureSource used by a layer
 *
 * @param layerId id of the layer for which the selector will be created
 * @returns selector with parameters state (mapsight selected already) and globalFeatureState (featureSources _not_ selected)
 */
export const makeFeatureSourceFromLayerIdSelector = (
	layerId: string,
): Selector<MapState, FeatureSourceState | null, [State]> =>
	createSelector(
		[
			(_, state: State) => state,
			makeFeatureSourceControllerNameFromLayerIdSelector(layerId),
			makeFeatureSourceIdFromLayerIdSelector(layerId),
		],
		(state, featureControllerName, featureSourceId) => {
			if (featureControllerName && featureSourceId) {
				return (
					(state[featureControllerName] as FeatureSourcesState)[
						featureSourceId
					] ?? null
				);
			}
			return null;
		},
	);

export const mapSizeSelector = (state: MapState) => state.size;

/**
 * The Mapsight view is always created in the OpenLayers default projection;
 * a `projection` key in the view state is not passed on to the view.
 */
const VIEW_PROJECTION = "EPSG:3857";

/**
 * The view state, or `undefined` while the map has no view state yet. See
 * {@link MapViewState} for the coordinate systems of its fields.
 */
export const viewSelector = (state: MapState): MapViewState | undefined => {
	const view = state.view;
	return typeof view === "object" && view !== null ? view : undefined;
};
/**
 * Center of the view: in view projection coordinates (EPSG:3857), or in the
 * user projection when one is set (for example `useGeographic()`).
 */
export const viewCenterSelector = (state: MapState) =>
	viewSelector(state)?.center;
/** Rounded zoom level. Use {@link viewResolutionSelector} for the exact value. */
export const viewZoomSelector = (state: MapState) => viewSelector(state)?.zoom;
/** Rotation in radians; 0 when the view was never rotated. */
export const viewRotationSelector = (state: MapState) =>
	viewSelector(state)?.rotation ?? 0;
/** Map units per pixel in view projection (EPSG:3857), never in user projection units. */
export const viewResolutionSelector = (state: MapState) =>
	viewSelector(state)?.resolution;

/**
 * Visible extent `[minX, minY, maxX, maxY]`, derived from center, resolution,
 * rotation and map size. It uses the same coordinate system as the center: view
 * projection (EPSG:3857) units, or the user projection when one is set (for
 * example degrees after `useGeographic()` from `ol/proj`), like
 * `view.calculateExtent()`. With a rotated view this is the bounding box of
 * the visible area. `undefined` while center, resolution or size are missing,
 * for example before the map is mounted. Keeps its reference while the extent
 * is unchanged.
 */
export const viewExtentSelector: Selector<MapState, Extent | undefined> =
	createSelector(
		[
			viewCenterSelector,
			viewResolutionSelector,
			viewRotationSelector,
			mapSizeSelector,
			// Global OpenLayers setting, not part of the state.
			() => getUserProjection(),
		],
		(center, resolution, rotation, size, userProjection) => {
			if (!center || resolution === undefined || !size) {
				return undefined;
			}
			// Without a user projection nothing needs converting. Skipping the
			// helpers also avoids OpenLayers' one-time "call useGeographic()"
			// warning for centers that merely look like degrees.
			const extent = getForViewAndSize(
				userProjection
					? fromUserCoordinate(center, VIEW_PROJECTION)
					: center,
				resolution,
				rotation,
				size,
			);
			return userProjection
				? toUserExtent(extent, VIEW_PROJECTION)
				: extent;
		},
		{memoizeOptions: {resultEqualityCheck: isEqual}},
	);

export const viewportAnchorSelector = (state: MapState) => state.viewportAnchor;

// die tatsächlich von OpenLayer gerenderten Layer. wenn ein Layer mit option.visible grundsätzlich aktiv ist, aber an der angezeigten Stelle nichts beiträgt, ist er hier nicht verzeichnet.
export const visibleLayersSelector = (state: MapState) =>
	state.visibleLayers || [];

export type LayerAttributions = {[layerId: string]: string};

export const reduceLayersToAttributions = (
	layers?: MapState["layers"],
): LayerAttributions => {
	if (layers === undefined) {
		return {};
	}

	const entries = Object.keys(layers)
		.map((layerId) =>
			mapNonNullable(
				layers[layerId]?.metaData?.attribution,
				(attribution) => [layerId, attribution] as const,
			),
		)
		.filter(isNonNullable);
	return Object.fromEntries(entries);
};

export const layerAttributionsSelector: Selector<
	MapState,
	LayerAttributions | null
> = createSelector([layersSelector], reduceLayersToAttributions);

// TODO Dokumentation notwendig
export const getVisibleLayerAttributions = (
	visibleLayers: string[] | undefined,
	layerAttributions: LayerAttributions | null,
): LayerAttributions => {
	if (visibleLayers === undefined || layerAttributions === null) {
		return {};
	}

	const entries = unique(visibleLayers)
		.map((layerId) =>
			mapNonNullable(
				layerAttributions[layerId],
				(attribution: string | undefined) =>
					attribution ? ([layerId, attribution] as const) : null,
			),
		)
		.filter(isNonNullable);
	return Object.fromEntries(entries);
};

export const visibleLayerAttributionsSelector: Selector<
	MapState,
	LayerAttributions | null
> = createSelector(
	[visibleLayersSelector, layerAttributionsSelector],
	getVisibleLayerAttributions,
);

export type LayerLegends = {[layerId: string]: string};

export const reduceLayersToLegends = (
	layers: MapState["layers"] = {},
): LayerLegends => {
	const entries = Object.entries(layers)
		.map(([layerId, layer]) =>
			mapNonNullable(
				layer.metaData?.legend,
				(legend) => [layerId, legend] as const,
			),
		)
		.filter(isNonNullable);
	return Object.fromEntries(entries);
};

export const reduceToLayersWithLegends = (layers: MapState["layers"] = {}) => {
	const entries = Object.entries(layers).filter(
		([_, layer]) => layer.metaData?.legend,
	);
	return Object.fromEntries(entries);
};

export const reduceToLayersWithMiniLegends = (
	layers: MapState["layers"] = {},
) => {
	const entries = Object.entries(layers).filter(
		([_, layer]) => layer?.metaData?.miniLegend,
	);
	return Object.fromEntries(entries);
};

export const layersWithLegendsSelector: Selector<
	MapState,
	Record<string, LayerState>
> = createSelector(layersSelector, reduceToLayersWithLegends);

export const layersWithMiniLegendsSelector: Selector<
	MapState,
	Record<string, LayerState>
> = createSelector(layersSelector, reduceToLayersWithMiniLegends);

export const visibleLayersWithLegendsSelector: Selector<
	MapState,
	Record<string, LayerState>
> = createSelector(
	[visibleLayersSelector, layersWithLegendsSelector],
	reduceByKeys,
);
export const visibleLayersWithMiniLegendsSelector: Selector<
	MapState,
	Record<string, LayerState>
> = createSelector(
	[visibleLayersSelector, layersWithMiniLegendsSelector],
	reduceByKeys,
);
