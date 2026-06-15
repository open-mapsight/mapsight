import type {CountAggregatorAppConfig, CountAggregatorFeatures} from "../types";

type FeatureKey = keyof CountAggregatorFeatures;

export function isFeatureEnabled(
	appConfig: CountAggregatorAppConfig,
	feature: FeatureKey,
): boolean {
	return appConfig.features?.[feature] ?? false;
}
