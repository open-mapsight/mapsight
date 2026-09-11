import merge from "lodash/merge";

import type {CreateOptions} from "./types";

/**
 * Deep-merge create options, but keep the injected FeatureSourceCache
 * instance. Lodash merge clones plain objects, and single-flight/purge
 * key WeakMap state by adapter identity.
 */
export function mergeCreateOptions(
	defaults: CreateOptions,
	createOptions: CreateOptions,
): CreateOptions {
	const merged = merge({}, defaults, createOptions);
	merged.featureSourceCache = createOptions.featureSourceCache;
	return merged;
}
