import type {CacheTtlPolicy} from "@/lib/feature-sources/cache/http-freshness";
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
	lastModified?: string;
	cacheControl?: string;
	expires?: string;
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
		entry: Omit<FeatureSourceCacheEntry, "key" | "tier">,
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
	/**
	 * Shared HTTP cache (SSR sidecar). Honors `s-maxage` and `proxy-revalidate`.
	 * Defaults to `true` when `window` is undefined.
	 */
	sharedCache?: boolean;
	/** Clamp / skip-persist policy. Defaults: 10s min, 5min default, 1h max. */
	cacheTtl?: Partial<CacheTtlPolicy>;
};

export type BuildCacheKeyInput = {
	controllerName: string;
	featureSourceId: string;
	url?: string;
	appVersion?: string;
};
