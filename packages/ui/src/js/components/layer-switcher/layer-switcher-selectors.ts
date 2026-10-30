import type {Selector} from "@reduxjs/toolkit";

import type {FeatureSourceState} from "@mapsight/core/lib/feature-sources/types";
import {
	makeFeatureSourceFromLayerIdSelector,
	makeFeatureSourceIdFromLayerIdSelector,
	makeLayerLockedInLayerSwitcherSelector,
	makeLayerTitleSelector,
	makeLayerVisibleSelector,
} from "@mapsight/core/lib/map/selectors";
import type {MapState} from "@mapsight/core/lib/map/types";
import type {State} from "@mapsight/core/types";

type LayerTitleSelector = (state: MapState) => string;
type LayerLockedSelector = (state: MapState) => boolean;
type LayerVisibleSelector = (state: MapState) => boolean;
type FeatureSourceIdSelector = (state: MapState) => string | undefined;
type FeatureSourceSelector = Selector<
	MapState,
	FeatureSourceState | null,
	[State]
>;

const layerTitleSelectorCache = new Map<string, LayerTitleSelector>();
const layerLockedSelectorCache = new Map<string, LayerLockedSelector>();
const layerVisibleSelectorCache = new Map<string, LayerVisibleSelector>();
const featureSourceIdSelectorCache = new Map<string, FeatureSourceIdSelector>();
const featureSourceSelectorCache = new Map<string, FeatureSourceSelector>();

function getOrCreate<T>(
	cache: Map<string, T>,
	id: string,
	create: (id: string) => T,
): T {
	let selector = cache.get(id);
	if (!selector) {
		selector = create(id);
		cache.set(id, selector);
	}
	return selector;
}

export function cachedMakeLayerTitleSelector(id: string): LayerTitleSelector {
	return getOrCreate(layerTitleSelectorCache, id, makeLayerTitleSelector);
}

export function cachedMakeLayerLockedInLayerSwitcherSelector(
	id: string,
): LayerLockedSelector {
	return getOrCreate(
		layerLockedSelectorCache,
		id,
		makeLayerLockedInLayerSwitcherSelector,
	);
}

export function cachedMakeLayerVisibleSelector(
	id: string,
): LayerVisibleSelector {
	return getOrCreate(layerVisibleSelectorCache, id, makeLayerVisibleSelector);
}

export function cachedMakeFeatureSourceIdFromLayerIdSelector(
	id: string,
): FeatureSourceIdSelector {
	return getOrCreate(
		featureSourceIdSelectorCache,
		id,
		makeFeatureSourceIdFromLayerIdSelector,
	);
}

export function cachedMakeFeatureSourceFromLayerIdSelector(
	id: string,
): FeatureSourceSelector {
	return getOrCreate(
		featureSourceSelectorCache,
		id,
		makeFeatureSourceFromLayerIdSelector,
	);
}
