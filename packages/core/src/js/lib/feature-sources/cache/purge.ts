import {documentCacheKeyMatchesUrl} from "@/lib/feature-sources/cache/build-cache-key";
import {bumpDocumentCacheGeneration} from "@/lib/feature-sources/cache/single-flight";
import type {FeatureSourceCache} from "@/lib/feature-sources/cache/types";

export type PurgeableFeatureSourceCache = FeatureSourceCache & {
	keys(): string[];
};

/**
 * Drop stored xhr-json documents. Omit `urls` (or pass []) to clear the
 * whole adapter. Used by the SSR publish hook so the next render cannot
 * dehydrate a pre-publish body.
 */
export async function purgeDocumentCacheEntries(
	cache: PurgeableFeatureSourceCache,
	urls?: readonly string[],
): Promise<string[]> {
	const unique = [
		...new Set((urls ?? []).map((url) => url.trim()).filter(Boolean)),
	];
	bumpDocumentCacheGeneration(cache, unique);
	const keys =
		unique.length === 0
			? cache.keys()
			: cache
					.keys()
					.filter((key) =>
						unique.some((url) =>
							documentCacheKeyMatchesUrl(key, url),
						),
					);

	await Promise.all(keys.map((key) => cache.delete(key)));
	return keys;
}
