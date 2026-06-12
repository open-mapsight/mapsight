import type {
	CountAggregatorAppConfig,
	CountAggregatorFeatures,
} from "../types/index.js";

type FeatureKey = keyof CountAggregatorFeatures;

export function isFeatureEnabled(
	appConfig: CountAggregatorAppConfig,
	feature: FeatureKey,
): boolean {
	const fromFeatures = appConfig.features?.[feature];
	if (fromFeatures !== undefined) {
		return fromFeatures;
	}

	if (feature === "events") {
		return appConfig.showEvents ?? false;
	}

	if (feature === "presets") {
		return appConfig.endpoints?.presets !== undefined;
	}

	return false;
}
