import type {FilterFunction} from "@mapsight/core/lib/filter/types";

import {unreachable} from "@mapsight/lib-js/unreachable";

type TimeFilterState = {
	options?: {
		/** from datetime in ISO 8601 (Y-m-d\TH:i:sP) */
		fromDate?: string;
		/** to datetime in ISO 8601 (Y-m-d\TH:i:sP) */
		toDate?: string;
		/** if set to true the filter will filter even if neither from nor to date are set. */
		allowEmpty?: boolean;
	};
};

// TODO: document/collect magic property names
export interface FeatureWithWhen {
	when?: object;
	/** start datetime in ISO 8601 (Y-m-d\TH:i:sP) */
	start: string;
	/** end datetime in ISO 8601 (Y-m-d\TH:i:sP) */
	end: string;
}

/**
 * Feature filter to filter by when property in a time range.
 * Features are expected to have a when object property with
 * start and end datetimes.
 */
const timeFilter: FilterFunction = (features, filterState: TimeFilterState) => {
	const filterOptions = filterState.options;
	if (!filterOptions) {
		return features;
	}

	const {fromDate, toDate, allowEmpty = false} = filterOptions;
	if (!allowEmpty && !fromDate && !toDate) {
		return features;
	}

	// TODO: document/collect magic property names (here: when.start, when.end)
	const predicate = toDate
		? (feature) =>
				feature?.when?.start <= toDate &&
				feature?.when?.end >= (fromDate || Date.now())
		: fromDate
			? (feature) => feature?.when?.end >= fromDate
			: unreachable();

	return features.filter(predicate);
};

export default timeFilter;
