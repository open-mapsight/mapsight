import {hasFeatureSourceLoadError} from "@/lib/feature-sources/selectors";
import type {
	FeatureSourceData,
	FeatureSourcesState,
} from "@/lib/feature-sources/types";
import type {State} from "@/types";

/** Merges features from the named feature sources that have loaded data. */
export function combineFeatureSources(
	featureSourcesState: FeatureSourcesState | undefined,
	featureSourceNames: string[],
): FeatureSourceData {
	let combinedFeatures: FeatureSourceData["features"] = [];

	for (const id of featureSourceNames) {
		const source = featureSourcesState?.[id];
		if (!hasFeatureSourceLoadError(source) && source?.data) {
			combinedFeatures = [
				...combinedFeatures,
				...(source.data.features ?? []),
			];
		}
	}

	return {
		type: "FeatureCollection",
		features: combinedFeatures,
	};
}

export function createCombinedFeatureSourceSelector(
	featureSourceNames: string[],
	featureSourcesControllerName: string,
) {
	return function combinedFeatureSourceSelector(state: State) {
		const featureSourcesState = state[featureSourcesControllerName] as
			FeatureSourcesState | undefined;

		return {
			error: null,
			data: combineFeatureSources(
				featureSourcesState,
				featureSourceNames,
			) satisfies FeatureSourceData,
		};
	};
}

export function getCombinedFeatureSourceBindings(
	featureSources: FeatureSourcesState = {},
) {
	return Object.fromEntries(
		Object.entries(featureSources)
			.filter(([, source]) => source.type === "combined")
			.map(([id, source]) => [id, source.featureSourceNames ?? []]),
	);
}
