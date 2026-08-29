import type {FeatureSourceData} from "@/lib/feature-sources/types";
import type {Feature, FeatureId} from "@/types";

export type FeatureSourceCacheTier = "memory" | "idb";

export type FeatureSourceCacheEntry = {
	key: string;
	data: FeatureSourceData;
	ids?: FeatureId[];
	featuresById?: Record<FeatureId, Feature>;
	fetchedAt: number;
	etag?: string;
	bytes: number;
	tier: FeatureSourceCacheTier;
};

/**
 * Shared cache seam for xhr-json documents.
 *
 * Browser: memory + later IndexedDB. Server/SSR: process `Map` (and later Redis).
 * Eviction helpers are for the browser budget; the sidecar warm set does not call them.
 */
export interface FeatureSourceCache {
	get(key: string): Promise<FeatureSourceCacheEntry | null>;
	put(
		key: string,
		entry: Omit<FeatureSourceCacheEntry, "tier">,
	): Promise<void>;
	delete(key: string): Promise<void>;
	estimateTotalBytes(): Promise<number>;
	evictLRU(targetBytes: number): Promise<string[]>;
}

/** Passed as `createMapsightStore` extraArgument from UI `createOptions`. */
export type FeatureSourceCacheExtra = {
	featureSourceCache?: FeatureSourceCache;
	/** Shared revision token (`appVersion` / CMS publish id) used in document keys. */
	featureSourceRevision?: string;
};

export type BuildCacheKeyInput = {
	controllerName: string;
	featureSourceId: string;
	url?: string;
	appVersion?: string;
};
