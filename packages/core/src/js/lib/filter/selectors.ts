import type {
	FilterFunction,
	FilterState,
	FiltersState,
} from "@/lib/filter/types";
import type {Feature} from "@/types";

const filterFunctions: Record<string, FilterFunction> = {};

export const addFilterFunction = (
	filterKey: string,
	filterFunction: FilterFunction,
) => {
	filterFunctions[filterKey] = filterFunction;
};

const applyFilter = (
	features: Array<Feature>,
	filterKey: string,
	filterState: FilterState,
	featureSourceId: string,
) => {
	const filterFunction = filterFunctions[filterKey];
	if (filterFunction) {
		return filterFunction(features, filterState, featureSourceId);
	}

	console.info(
		`No filter function defined for ${filterKey}. skipping filter`,
	);
	return features;
};

/**
 * Applies filter to features
 *
 * @param filters Filters state
 * @param features Array of features to filter
 * @param featureSourceId id of the feature source
 * @returns Array of filtered features
 */
export const applyFilters = (
	filters: FiltersState,
	features: Array<Feature>,
	featureSourceId: string,
) =>
	Object.keys(filters).reduce(
		(filteredFeatures, filterKey) =>
			applyFilter(
				filteredFeatures,
				filterKey,
				filters[filterKey],
				featureSourceId,
			),
		features,
	);
