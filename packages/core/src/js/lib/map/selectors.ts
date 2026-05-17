import unique from "lodash/uniq";
import {createSelector} from "reselect";

import * as nonNull from "@mapsight/lib-js/nonNullable";
import reduceByKeys from "@mapsight/lib-redux/reducers/reduce-by-keys";

import type {FeatureSourcesState} from "@/lib/feature-sources/types";
import type {InteractionName, MapState} from "@/lib/map/types";
import type {State} from "@/types";

/**
 * select all layers from state
 */
export const layersSelector = (state: MapState) => state.layers;

export const makeLayerTitleSelector = (id: string) => (state: MapState) =>
	state.layers[id]?.metaData?.title;
export const makeLayerLockedInLayerSwitcherSelector =
	(id: string) => (state: MapState) =>
		state.layers[id]?.metaData?.lockedInLayerSwitcher;

export const makeLayerSelectionSelector =
	(id: string, interactionName: InteractionName) => (state: MapState) =>
		state.layers[id]?.options?.selections?.[interactionName];

export const layerIdsIntegratedSwitcherSelector = createSelector(
	(state: MapState) =>
		state.layers
			? Object.keys(state.layers).filter(
					(id) => state.layers[id]?.metaData?.visibleInLayerSwitcher,
				)
			: [],
	(_) => _, // cache result of above to deliver reference equality if array has the same contents
);
export const layerIdsExternalSwitcherSelector = createSelector(
	(state: MapState) =>
		state.layers
			? Object.keys(state.layers).filter(
					(id) =>
						state.layers[id]?.metaData
							?.visibleInExternalLayerSwitcher,
				)
			: [],
	(_) => _, // cache result of above to deliver reference equality if array has the same contents
);

// createSelector only caches the very last one result, so we have to create a new selector per ID, see ""But there is a problem!", https://github.com/reduxjs/reselect#selectorstodoselectorsjs
export const makeLayerVisibleSelector = (id: string) =>
	createSelector(
		[(state: MapState) => state.layers[id]],
		(layer) => layer?.options?.visible ?? false,
	);

export const makeFeatureSourceIdFromLayerIdSelector = (layerId: string) =>
	createSelector(
		[(state: MapState) => state.layers[layerId]],
		(layer) => layer?.options?.source?.options?.featureSourceId,
	);

export const makeFeatureSourceControllerNameFromLayerIdSelector = (
	layerId: string,
) =>
	createSelector(
		[(state: MapState) => state.layers[layerId]],
		(layer) =>
			layer?.options?.source?.options?.featureSourcesControllerName,
	);

/**
 * create selector for featureState corresponding to the featureSource used by a layer
 *
 * @param layerId id of the layer for which the selector will be created
 * @returns selector with parameters state (mapsight selected already) and globalFeatureState (featureSources _not_ selected)
 */
export const makeFeatureSourceFromLayerIdSelector = (layerId: string) =>
	createSelector(
		[
			(_, state: State) => state,
			makeFeatureSourceControllerNameFromLayerIdSelector(layerId),
			makeFeatureSourceIdFromLayerIdSelector(layerId),
		],
		(state, featureControllerName, featureSourceId) =>
			featureControllerName &&
			featureSourceId &&
			state[featureControllerName]
				? (state[featureControllerName] as FeatureSourcesState)[
						featureSourceId
					]
				: null,
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
			nonNull.map(
				layers[layerId]?.metaData?.attribution,
				(attribution) => [layerId, attribution] as const,
			),
		)
		.filter(nonNull.is);
	return Object.fromEntries(entries);
};

export const layerAttributionsSelector = createSelector(
	[layersSelector],
	reduceLayersToAttributions,
);

// TODO Dokumentation notwendig
export const getVisibleLayerAttributions = (
	visibleLayers: string[] | undefined,
	layerAttributions: LayerAttributions,
): LayerAttributions => {
	const entries = unique(visibleLayers ?? [])
		.map((layerId) =>
			nonNull.map(
				layerAttributions[layerId],
				(attribution) => [layerId, attribution] as const,
			),
		)
		.filter(nonNull.is);
	return Object.fromEntries(entries);
};

export const visibleLayerAttributionsSelector = createSelector(
	[visibleLayersSelector, layerAttributionsSelector],
	getVisibleLayerAttributions,
);

export type LayerLegends = {[layerId: string]: string};

export const reduceLayersToLegends = (
	layers: MapState["layers"] = {},
): LayerLegends => {
	const entries = Object.entries(layers)
		.map(([layerId, layer]) =>
			nonNull.map(
				layer.metaData?.legend,
				(legend) => [layerId, legend] as const,
			),
		)
		.filter(nonNull.is);
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

export const layersWithLegendsSelector = createSelector(
	layersSelector,
	reduceToLayersWithLegends,
);
export const layersWithMiniLegendsSelector = createSelector(
	layersSelector,
	reduceToLayersWithMiniLegends,
);

export const visibleLayersWithLegendsSelector = createSelector(
	[visibleLayersSelector, layersWithLegendsSelector],
	reduceByKeys,
);
export const visibleLayersWithMiniLegendsSelector = createSelector(
	[visibleLayersSelector, layersWithMiniLegendsSelector],
	reduceByKeys,
);
