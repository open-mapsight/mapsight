import type {FilterFunction} from "@mapsight/core/lib/filter/types";

import getPath from "@mapsight/lib-js/object/getPath";

import type {MapsightUiFeature} from "../types";

type CacheEntry = {
	features: Array<MapsightUiFeature>;
	filtered: Array<MapsightUiFeature>;
	visibleTags: Record<string, Array<string>>;
	visibleTagGroups: Record<string, boolean>;
};

/**
 * Creates a cached tag filter function
 */
export function createTagFilterFunction(): FilterFunction {
	const cache: Record<string, CacheEntry> = {};

	return function tagFilterFunction(_features, filterState, featureSourceId) {
		// FIXME: unify types for Features in core and ui
		const features = _features as MapsightUiFeature[];

		// early return if parameters are missing
		if (!featureSourceId || !filterState || !features) {
			return features;
		}

		// show all features, if no tag is selected
		const visibleTags = getPath(filterState, [
			"visibleTags",
			featureSourceId,
		]) as Record<string, string[]>;
		const visibleTagGroups = getPath(filterState, [
			"visibleTagGroups",
			featureSourceId,
		]) as Record<string, boolean>;
		if (!visibleTags && !visibleTagGroups) {
			return features;
		}

		let fromCache = cache[featureSourceId];

		if (
			fromCache === undefined ||
			fromCache.features !== features ||
			fromCache.visibleTags !== visibleTags ||
			fromCache.visibleTagGroups !== visibleTagGroups
		) {
			const flattenedTags = transformTagMapsToArrays(
				visibleTags,
				visibleTagGroups,
			);

			fromCache = cache[featureSourceId] = {
				// inputs:
				features: features,
				visibleTags: visibleTags,
				visibleTagGroups: visibleTagGroups,
				// output:
				filtered: features.filter((feature) =>
					flattenedTags.every(({group, tags}) =>
						isFeatureMatchingFilter(feature, group, tags),
					),
				),
			};
		}

		return fromCache?.filtered;
	};
}

/**
 * @deprecated Do not use. This uses a global cache. Use export createTagFilterFunction instead to create local function per mapsight instance!
 */
const deprecatedTagFilterFunction = createTagFilterFunction();
export default deprecatedTagFilterFunction;

function transformTagMapsToArrays(
	visibleTags: Record<string, Array<string>> | null = null,
	visibleTagGroups: Record<string, boolean> | null = null,
) {
	const result = {};
	if (visibleTags) {
		Object.keys(visibleTags).forEach((group) => {
			const tags = getVisibleTagsForGroup(visibleTags, group);
			if (tags.length) {
				result[group] = tags;
			}
		});
	}
	if (visibleTagGroups) {
		Object.keys(visibleTagGroups).forEach((group) => {
			const isActive = !!visibleTagGroups[group];

			if (isActive) {
				result[group] = result[group] || true;
			}
		});
	}

	return Object.keys(result).map((group) => {
		const tags = result[group];
		return {group: group, tags: tags};
	});
}

function getVisibleTagsForGroup(
	visibleTags: Record<string, Array<string>>,
	tagGroup: string,
) {
	return Object.keys(visibleTags[tagGroup]!).filter(
		(tag) => visibleTags[tagGroup]![tag] === true,
	);
}

function isFeatureMatchingFilter(
	feature: MapsightUiFeature,
	group: string,
	visibleTags: boolean | Array<string>,
): boolean {
	const featureData = feature.properties?.tagGroups?.[group];
	if (!featureData) {
		return false;
	}

	const {andJunction, tags} = featureData;
	if (visibleTags === true) {
		return !!tags.length;
	}

	return visibleTags[andJunction === true ? "every" : "some"](
		(tag) => tags.indexOf(tag) > -1,
	);
}
