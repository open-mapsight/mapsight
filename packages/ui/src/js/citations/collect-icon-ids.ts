import type {
	FeatureSourceState,
	FeatureSourcesState,
} from "@mapsight/core/lib/feature-sources/types";
import {
	type LayerState,
	isVectorFeatureSource,
} from "@mapsight/core/lib/map/types";

type FeatureLike = {
	properties?: Record<string, unknown> | null;
};

export function iconIdFromLayerStyle(style: unknown): string | undefined {
	if (style == null || typeof style !== "object") {
		return undefined;
	}

	const mapsightIconId = (style as {mapsightIconId?: unknown}).mapsightIconId;
	return typeof mapsightIconId === "string" && mapsightIconId.trim()
		? mapsightIconId
		: undefined;
}

export function iconIdsFromFeatures(
	features: readonly FeatureLike[] | undefined,
): string[] {
	const ids: string[] = [];
	for (const feature of features ?? []) {
		const value = feature.properties?.mapsightIconId;
		if (typeof value === "string" && value.trim()) {
			ids.push(value);
		}
	}
	return ids;
}

export function listFeatureSourceIdsForCitations(
	listFeatureSourceId: string | undefined,
	featureSources: FeatureSourcesState | Record<string, FeatureSourceState>,
): string[] {
	if (!listFeatureSourceId) {
		return [];
	}

	const source = featureSources[listFeatureSourceId];
	if (source?.type === "combined") {
		return source.featureSourceNames ?? [];
	}

	return [listFeatureSourceId];
}

function layerFeatureSourceId(layer: LayerState): string | undefined {
	const source = layer.options?.source;
	if (!isVectorFeatureSource(source)) {
		return undefined;
	}
	return source.options.featureSourceId;
}

export function collectCitationIconIds({
	hostPictogramIds = [],
	visibleLayerIds = [],
	layers = {},
	listFeatureSourceId,
	featureSources = {},
	searchResultFeatures = [],
}: {
	hostPictogramIds?: readonly (string | null | undefined)[];
	visibleLayerIds?: readonly string[];
	layers?: Record<string, LayerState>;
	listFeatureSourceId?: string;
	featureSources?: FeatureSourcesState | Record<string, FeatureSourceState>;
	searchResultFeatures?: readonly FeatureLike[];
}): string[] {
	const ids: string[] = [];
	const seen = new Set<string>();

	const push = (value: string | undefined) => {
		if (!value || seen.has(value)) {
			return;
		}
		seen.add(value);
		ids.push(value);
	};

	for (const hostId of hostPictogramIds) {
		if (typeof hostId === "string") {
			push(hostId);
		}
	}

	for (const layerId of visibleLayerIds) {
		push(iconIdFromLayerStyle(layers[layerId]?.options?.style));
	}

	const listSourceIds = listFeatureSourceIdsForCitations(
		listFeatureSourceId,
		featureSources,
	);

	for (const layer of Object.values(layers)) {
		const sourceId = layerFeatureSourceId(layer);
		if (sourceId && listSourceIds.includes(sourceId)) {
			push(iconIdFromLayerStyle(layer.options?.style));
		}
	}

	for (const sourceId of listSourceIds) {
		for (const iconId of iconIdsFromFeatures(
			featureSources[sourceId]?.data?.features,
		)) {
			push(iconId);
		}
	}

	if (searchResultFeatures.length > 0) {
		for (const iconId of iconIdsFromFeatures(searchResultFeatures)) {
			push(iconId);
		}
	}

	return ids;
}
