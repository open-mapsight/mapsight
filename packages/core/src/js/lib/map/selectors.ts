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
import type {LayerState, MapState} from "@/lib/map/types";
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
