import {z} from "zod";

import type {FilterFunction} from "@mapsight/core/lib/filter/types";

import {unreachable} from "@mapsight/lib-js/unreachable";

export const timeFilterConfigSchema = z.looseObject({
	options: z
		.looseObject({
			fromDate: z.string().optional(),
			toDate: z.string().optional(),
			allowEmpty: z.boolean().optional(),
		})
		.optional(),
});

export type TimeFilterState = z.infer<typeof timeFilterConfigSchema>;

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
