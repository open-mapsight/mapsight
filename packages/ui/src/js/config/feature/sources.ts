import type {
	FeatureSourceConfig,
	FeatureSourceState,
} from "@mapsight/core/lib/feature-sources/types";

type FeatureSourceDefinition = FeatureSourceConfig &
	Pick<FeatureSourceState, "data" | "lastUpdate" | "lastActionType">;

export {TIME_FILTER, TAG_FILTER} from "../constants/controllers";

/**
 * Create an empty feature source that can be filled using actions
 * and cannot not load features itself.
 *
 * @returns config for a plain feature source
 */
export function plain(): FeatureSourceDefinition {
	return {
		type: "noop" as const,
		data: null,
		lastUpdate: null,
		lastActionType: null,
	};
}

/**
 * Create a feature source that loads data from a remote url.
 *
 * @param url url to fetch data from
 * @returns config for a xhr json feature source
 */
export function xhrJson(url: string): FeatureSourceDefinition {
	return {
		type: "xhr-json" as const,
		url: url,
		data: null,
		lastUpdate: null,
		lastActionType: null,
	};
}

/**
 * Create a feature source that fetches data from a remote url.
 *
 * Additionally, it will fetch the data every {timer} milliseconds.
 *
 * @param url url to fetch data from
 * @param timer time in milliseconds to fetch new data
 * @returns config for a xhr json feature source that will refresh regularly
 */
export function xhrJsonRefreshing(
	url: string,
	timer: number,
): FeatureSourceDefinition {
	return {
		type: "xhr-json" as const,
		url: url,
		doRefresh: true,
		timer: timer,
		data: null,
		lastUpdate: null,
		lastActionType: null,
	};
}

/**
 * add a filter to the definition of a feature source.
 *
 * may be used iteratively.
 *
 * @param featureSource definition to extend by filterName
 * @param filterName name of filter to add to the filter collection. The feature filter will be applied when using the appropriate feature source selectors.
 * @returns extended definition of feature source
 */
export function withFilter<T extends Partial<FeatureSourceDefinition>>(
	featureSource: T,
	filterName: string,
): T & Pick<FeatureSourceConfig, "filters"> {
	return {
		...featureSource,
		filters: [...(featureSource.filters || []), filterName],
	};
}

/** Creates a feature source config that aggregates member feature sources. */
export function combinedFeatureSource(
	featureSourceNames: string[] = [],
): FeatureSourceDefinition {
	return {
		type: "combined",
		featureSourceNames,
		data: null,
		lastUpdate: null,
		lastActionType: null,
	};
}
