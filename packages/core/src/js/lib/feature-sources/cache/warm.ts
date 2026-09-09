import {buildDocumentCacheKey} from "@/lib/feature-sources/cache/build-cache-key";
import {estimateFeatureSourceBytes} from "@/lib/feature-sources/cache/estimate-bytes";
import {
	type CacheTtlPolicy,
	shouldPersistDocumentCache,
} from "@/lib/feature-sources/cache/http-freshness";
import {
	captureCacheWriteGeneration,
	isCacheWriteGenerationCurrent,
	singleFlight,
	withDocumentCacheWrite,
} from "@/lib/feature-sources/cache/single-flight";
import type {FeatureSourceCache} from "@/lib/feature-sources/cache/types";
import {fetchXhrJson} from "@/lib/feature-sources/loaders/xhr-json-loader";

export type WarmFeatureSourceUrlOptions = {
	/**
	 * Shared-cache freshness (`s-maxage`, `proxy-revalidate`).
	 * Defaults to `true` when `window` is undefined (SSR sidecar).
	 */
	shared?: boolean;
	ttl?: Partial<CacheTtlPolicy>;
};

function defaultSharedCache(): boolean {
	return typeof window === "undefined";
}

/**
 * Fetch one xhr-json URL through the shared loader and `cache.put`.
 * Failed entries stay cold. Returns whether the document is now cached.
 *
 * Shares the same `singleFlight` slot as `load()` and returns the document
 * body from that flight so a concurrent load cannot observe `true`.
 */
export async function warmFeatureSourceUrl(
	cache: FeatureSourceCache,
	url: string,
	revision?: string,
	options?: WarmFeatureSourceUrlOptions,
): Promise<boolean> {
	const key = buildDocumentCacheKey({url, revision});
	try {
		const data = await singleFlight(cache, key, async () => {
			const existing = await cache.get(key).catch(() => null);
			if (existing) {
				return existing.data;
			}

			const shared = options?.shared ?? defaultSharedCache();
			const generation = captureCacheWriteGeneration(cache, url);
			const result = await fetchXhrJson(url);
			await withDocumentCacheWrite(cache, async () => {
				if (!isCacheWriteGenerationCurrent(cache, url, generation)) {
					return;
				}
				if (
					!result.data ||
					!shouldPersistDocumentCache({
						cacheControl: result.cacheControl,
						expires: result.expires,
						fetchedAt: result.fetchedAt,
						date: result.date,
						ageSec: result.ageSec,
						shared,
						ttl: options?.ttl,
					})
				) {
					return;
				}
				await cache.put(key, {
					data: result.data,
					fetchedAt: result.fetchedAt,
					ageSec: result.ageSec,
					date: result.date,
					bytes: estimateFeatureSourceBytes(result.data),
					etag: result.etag,
					lastModified: result.lastModified,
					cacheControl: result.cacheControl,
					expires: result.expires,
				});
			});
			return result.data;
		});
		if (data === undefined) {
			return false;
		}
		return (await cache.get(key).catch(() => null)) != null;
	} catch {
		return false;
	}
}
