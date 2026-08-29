import {buildDocumentCacheKey} from "@/lib/feature-sources/cache/build-cache-key";
import {estimateFeatureSourceBytes} from "@/lib/feature-sources/cache/estimate-bytes";
import type {FeatureSourceCache} from "@/lib/feature-sources/cache/types";
import {load as loadXhrJson} from "@/lib/feature-sources/loaders/xhr-json-loader";

/**
 * Fetch one xhr-json URL through the shared loader and `cache.put`.
 * Failed entries stay cold. Returns whether the document is now cached.
 */
export async function warmFeatureSourceUrl(
	cache: FeatureSourceCache,
	url: string,
	revision?: string,
): Promise<boolean> {
	const key = buildDocumentCacheKey({url, revision});
	if (await cache.get(key)) {
		return true;
	}

	try {
		const data = await loadXhrJson({url});
		if (!data) {
			return false;
		}
		await cache.put(key, {
			key,
			data,
			fetchedAt: Date.now(),
			bytes: estimateFeatureSourceBytes(data),
		});
		return true;
	} catch {
		return false;
	}
}
