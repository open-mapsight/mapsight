import type {Selector} from "@reduxjs/toolkit";
import {createSelector} from "@reduxjs/toolkit";

import shallowEqualRecords from "@mapsight/lib-js/object/shallowEqualRecords";

import type {
	FeatureSourceData,
	FeatureSourceState,
	FeatureSourcesState,
} from "@/lib/feature-sources/types";
import {applyFilters} from "@/lib/filter/selectors";
import type {Feature, FeatureId, State} from "@/types";

export type FeatureSourceStatus =
	| typeof STATUS_OK
	| typeof STATUS_LOADING
	| typeof STATUS_ERROR;

export const STATUS_OK = "ok";
export const STATUS_LOADING = "loading";
export const STATUS_ERROR = "error";

export const ERROR = "error";
export const ERROR_PENDING = "errorPending";
export const ERROR_COLD_CACHE = "errorColdCache";

export const getSourceFilters = (source: FeatureSourceState) =>
	source.filters ?? [];
export const getAllFeatures = (source: FeatureSourceState) =>
	source.data?.features ?? [];

export const getSourceData = (source: FeatureSourceState): FeatureSourceData =>
	source.data || {};
export const getSourceDataHistory = (source: FeatureSourceState) =>
	source.dataHistory || {past: [], future: []};

function getFeatureIds(features: Feature[]) {
	return features.map((feature) => feature.id);
}

function getFeaturesById(features: Feature[]) {
	const featuresById: Record<FeatureId, Feature> = {};
	for (const feature of features) {
		featuresById[feature.id] ??= feature;
	}
	return Object.keys(featuresById).length ? featuresById : undefined;
}

export const canUndo = (source: FeatureSourceState) =>
	!!(source.dataHistory?.past && source.dataHistory.past.length > 0);
export const canRedo = (source: FeatureSourceState) =>
	!!(source.dataHistory?.future && source.dataHistory.future.length > 0);

export const getFeatureSourceStatus = (featureSource: FeatureSourceState) => {
	if (featureSource) {
		return featureSource.error
			? STATUS_ERROR
			: featureSource.isLoading
				? STATUS_LOADING
				: STATUS_OK;
	}

	return null;
};

export const findFeatureSourceForFeatureId = (
	sources: FeatureSourcesState,
	featureId: FeatureId,
): undefined | FeatureSourceState =>
	Object.values(sources).find((source) => source.ids?.includes(featureId));

export const findFeatureInFeatureSourcesById = (
	sources: FeatureSourcesState,
	featureId: FeatureId,
) => {
	if (!featureId) {
		return null;
	}

	const source = findFeatureSourceForFeatureId(sources, featureId);
	if (!source) {
		return null;
	}

	const sourceFeatures = getAllFeatures(source);
	if (!sourceFeatures || !sourceFeatures.length) {
		return null;
	}

	return source.featuresById?.[featureId] ?? null;
};

export const getRefreshPaused = (source: FeatureSourceState) =>
	!!source.refreshPaused;

export const getFeatureSourceError = (featureSource: FeatureSourceState) =>
	featureSource.error;

function createUnfilteredFeatureSourceSelector(
	featureSourcesControllerName: string,
	featureSourceId: string,
) {
	return (state: State) =>
		(
			state[featureSourcesControllerName] as
				| undefined
				| FeatureSourcesState
		)?.[featureSourceId];
}

function createUnfilteredFeaturesSelector(
	featureSourcesControllerName: string,
	featureSourceId: string,
) {
	return (state: State) =>
		(
			state[featureSourcesControllerName] as
				| undefined
				| FeatureSourcesState
		)?.[featureSourceId]?.data?.features || [];
}

type FilteredFeatureSourceSelectorCache = {
	source?: FeatureSourceState;
	filterNames?: Array<string>;
	filters?: Record<string, string>;
	state?: FeatureSourceState;
};

const EMPTY_FILTERS: Record<string, string> = {};

export function createFilteredFeatureSourceSelector(
	featureSourcesControllerName: string,
	featureSourceId: string,
	targetControllerName?: string,
) {
	const featureSourceSelector = createUnfilteredFeatureSourceSelector(
		featureSourcesControllerName,
		featureSourceId,
	);
	let filtersSelector: Selector<State, Record<string, string>> = () =>
		EMPTY_FILTERS;

	// internal state holding
	const cache: FilteredFeatureSourceSelectorCache = {};

	return function (state: State) {
		let hasChanged = false;

		const source = featureSourceSelector(state);
		if (source !== cache.source) {
			cache.source = source;
			hasChanged = true;

			const filterNames = (() => {
				if (targetControllerName) {
					const targetState = state[targetControllerName] as
						| undefined
						| {
								overrideFeatureSourceFilters?: Array<string>;
						  };

					if (
						targetState &&
						"overrideFeatureSourceFilters" in targetState
					) {
						return targetState.overrideFeatureSourceFilters;
					}
				}
				return source !== undefined
					? getSourceFilters(source)
					: undefined;
			})();

			if (filterNames !== cache.filterNames) {
				cache.filterNames = filterNames;

				filtersSelector = (state) =>
					Object.fromEntries(
						filterNames?.map((filter) => [
							filter,
							state[filter] as string,
						]) ?? [],
					);
			}
		}

		const filters = filtersSelector(state);
		if (!shallowEqualRecords(filters, cache.filters)) {
			cache.filters = filters;
			hasChanged = true;
		}

		if (hasChanged) {
			const filteredFeatures =
				filters && source?.data?.features
					? applyFilters(
							filters,
							source.data.features,
							featureSourceId,
						)
					: undefined;

			cache.state = source && {
				...source,
				data: filteredFeatures
					? {
							...source.data,
							type: "FeatureCollection",
							features: filteredFeatures,
						}
					: source.data,
				ids: filteredFeatures
					? getFeatureIds(filteredFeatures)
					: source.ids,
				featuresById: filteredFeatures
					? getFeaturesById(filteredFeatures)
					: source.featuresById,
			};
		}

		return cache.state;
	};
}

/*
type TagGroup = {
	andJunction: boolean;
	tags: Array<string>;
};

**
 * Returns tag groups for features
 *
 * @param features features
 * @returns tag groups
 *
export const tagGroupsFromFeaturesSelector = (features: Array<Feature>) => {
	const result: Record<string, TagGroup> = {};
	if (features) {
		features.forEach((entry) => {
			const featureTagGroups = entry.properties?.tagGroups;
			if (!featureTagGroups) {
				return;
			}

			Object.keys(featureTagGroups).forEach((key) => {
				// hier müssen nicht nur die Objekte gemergt werden, sondern die Inhalte des Array .tags
				const existingTagGroup = result[key];
				const featureTagGroup = featureTagGroups[key];
				result[key] = {
					andJunction:
						featureTagGroup.andJunction ||
						existingTagGroup?.andJunction,
					tags: existingTagGroup
						? union(existingTagGroup.tags, featureTagGroup.tags)
						: featureTagGroup.tags,
				};
			});
		});
	}

	return result;
};
 */

type TagGroupWithCount = {
	count: number;
	tags: Record<string, number>;
};

/**
 * Returns grouped tags with count
 *
 * @param features features
 * @returns grouped tags with count
 */
export function getGroupedTagsWithCountFromFeatures(features: Array<Feature>) {
	const result: Record<string, TagGroupWithCount> = {};
	if (features) {
		features.forEach((entry) => {
			const featureTagGroups = entry.properties?.tagGroups as
				| Record<"tags", {tags?: Array<string>}>
				| undefined;
			if (!featureTagGroups) {
				return;
			}

			Object.entries(featureTagGroups).forEach(([name, group]) => {
				const tagsForGroup = group.tags;
				const tagGroupWithCount: TagGroupWithCount = result[name] ?? {
					count: 0,
					tags: {},
				};
				result[name] = tagGroupWithCount;

				if (tagsForGroup && tagsForGroup.length) {
					tagGroupWithCount.count += 1;
					tagsForGroup.forEach((tag) => {
						tagGroupWithCount.tags[tag] =
							tagGroupWithCount.tags[tag] ?? 0;
						tagGroupWithCount.tags[tag] += 1;
					});
				}
			});
		});
	}
	return result;
}

export function createTagsWithCountFromFeatureSourceSelector(
	featureSourcesControllerName: string,
	featureSourceId: string,
): Selector<State, Record<string, TagGroupWithCount>> {
	const featureSourceSelector = createUnfilteredFeaturesSelector(
		featureSourcesControllerName,
		featureSourceId,
	);

	return createSelector(
		[featureSourceSelector],
		getGroupedTagsWithCountFromFeatures,
	);
}

export const mapFeaturesToFeatureSource = <TFeature extends Feature = Feature>(
	features: Array<TFeature>,
): FeatureSourceState => ({
	type: "local",
	lastUpdate: Date.now(),
	lastActionType: null,
	data: {
		type: "FeatureCollection",
		features: features,
	},
});

/**
 * Checks if the feature source state warrants an update
 *
 * @param state state to check
 * @returns true if update is due, false otherwise
 */
export function getIsDue(state: FeatureSourceState) {
	// always okay if we do not refresh, but load if we have not loaded yet
	if (state.doRefresh !== true || !state.timer || state.timer < 1) {
		return !state.lastUpdate;
	}

	// otherwise check timer
	const now = +new Date();
	return now - (state.lastUpdate || 0) >= state.timer;
}
