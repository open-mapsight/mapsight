import {buildDocumentCacheKey} from "@/lib/feature-sources/cache/build-cache-key";
import {estimateFeatureSourceBytes} from "@/lib/feature-sources/cache/estimate-bytes";
import {
	type CacheTtlPolicy,
	shouldPersistDocumentCache,
} from "@/lib/feature-sources/cache/http-freshness";
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
 */
export async function warmFeatureSourceUrl(
	cache: FeatureSourceCache,
	url: string,
	revision?: string,
	options?: WarmFeatureSourceUrlOptions,
): Promise<boolean> {
	const key = buildDocumentCacheKey({url, revision});
	if (await cache.get(key)) {
		return true;
	}

	const shared = options?.shared ?? defaultSharedCache();
	try {
		const result = await fetchXhrJson(url);
		if (
			!result.data ||
			!shouldPersistDocumentCache({
				cacheControl: result.cacheControl,
				expires: result.expires,
				shared,
				ttl: options?.ttl,
			})
		) {
			return false;
		}
		await cache.put(key, {
			data: result.data,
			fetchedAt: Date.now(),
			bytes: estimateFeatureSourceBytes(result.data),
			etag: result.etag,
			lastModified: result.lastModified,
			cacheControl: result.cacheControl,
			expires: result.expires,
		});
		return true;
	} catch {
		return false;
	}
}
