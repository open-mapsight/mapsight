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
	const combinedFeatures: NonNullable<FeatureSourceData["features"]> = [];

	for (const id of featureSourceNames) {
		const source = featureSourcesState?.[id];
		if (!hasFeatureSourceLoadError(source) && source?.data) {
			for (const feature of source.data.features ?? []) {
				combinedFeatures.push(feature);
			}
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
	let previousMembers: Array<FeatureSourceData["features"]> | undefined;
	let result: {error: null; data: FeatureSourceData} | undefined;

	return function combinedFeatureSourceSelector(state: State) {
		const featureSourcesState = state[featureSourcesControllerName] as
			FeatureSourcesState | undefined;

		// Loading flags and collection metadata do not change the combined
		// features. Compare the contributing arrays, rather than rebuilding
		// them and making the observer deep-compare every feature per action.
		const members = featureSourceNames.map((id) => {
			const source = featureSourcesState?.[id];
			return hasFeatureSourceLoadError(source)
				? undefined
				: source?.data?.features;
		});
		if (
			result &&
			previousMembers?.length === members.length &&
			members.every(
				(features, index) => features === previousMembers![index],
			)
		) {
			return result;
		}
		previousMembers = members;
		result = {
			error: null,
			data: combineFeatureSources(
				featureSourcesState,
				featureSourceNames,
			) satisfies FeatureSourceData,
		};
		return result;
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
