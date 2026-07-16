import {combineFeatureSources} from "@/lib/feature-sources/lib/combined";
import type {
	FeatureSourceData,
	FeatureSourceState,
	FeatureSourcesState,
} from "@/lib/feature-sources/types";
import type {State} from "@/types";

type CombinedLoaderOptions = {
	controllerName?: string;
};

export function load(
	state: FeatureSourceState,
	options: CombinedLoaderOptions = {},
	_id: string,
	getState: () => unknown,
): Promise<FeatureSourceData> {
	const controllerName = options.controllerName ?? "featureSources";
	const featureSourcesState = (getState() as State)[controllerName] as
		FeatureSourcesState | undefined;
	const featureSourceNames = state.featureSourceNames ?? [];

	return Promise.resolve(
		combineFeatureSources(featureSourcesState, featureSourceNames),
	);
}
