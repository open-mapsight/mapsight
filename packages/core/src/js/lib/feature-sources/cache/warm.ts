import {buildDocumentCacheKey} from "@/lib/feature-sources/cache/build-cache-key";
import {estimateFeatureSourceBytes} from "@/lib/feature-sources/cache/estimate-bytes";
import {
	type CacheTtlPolicy,
	canServeDocumentCacheEntry,
	evaluateFreshness,
	isShareableCachedResponse,
	shouldPersistDocumentCache,
} from "@/lib/feature-sources/cache/http-freshness";
import {
	type CacheWriteGeneration,
	captureCacheWriteGeneration,
	isCacheWriteGenerationCurrent,
	singleFlightIfShareable,
	withDocumentCacheWrite,
} from "@/lib/feature-sources/cache/single-flight";
import type {
	FeatureSourceCache,
	FeatureSourceCacheEntry,
} from "@/lib/feature-sources/cache/types";
import {
	type XhrJsonFetchResult,
	fetchXhrJson,
	resolveXhrJsonUrl,
} from "@/lib/feature-sources/loaders/xhr-json-loader";
import type {FeatureSourceData} from "@/lib/feature-sources/types";

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
 * Shares the same flight slot as `load()` and returns the document body from
 * that flight so a concurrent load cannot observe `true`. Shared-cache
 * waiters do not observe `private` / `no-store` bodies.
 */
export async function warmFeatureSourceUrl(
	cache: FeatureSourceCache,
	url: string,
	revision?: string,
	options?: WarmFeatureSourceUrlOptions,
): Promise<boolean> {
	const resolvedUrl = resolveXhrJsonUrl(url);
	const key = buildDocumentCacheKey({url: resolvedUrl, revision});
	const shared = options?.shared ?? defaultSharedCache();
	try {
		const data = await singleFlightIfShareable(
			cache,
			key,
			() =>
				warmDocumentFlight(
					cache,
					key,
					resolvedUrl,
					shared,
					options?.ttl,
				),
			shared,
			options?.ttl,
		);
		if (data === undefined) {
			return false;
		}
		return (await cache.get(key).catch(() => null)) != null;
	} catch {
		return false;
	}
}

async function warmDocumentFlight(
	cache: FeatureSourceCache,
	key: string,
	resolvedUrl: string,
	shared: boolean,
	ttl?: Partial<CacheTtlPolicy>,
): Promise<{value: FeatureSourceData | undefined; share: boolean}> {
	const generation = captureCacheWriteGeneration(cache, resolvedUrl);
	let existing = await cache.get(key).catch(() => null);
	if (
		existing &&
		!isCacheWriteGenerationCurrent(cache, resolvedUrl, generation)
	) {
		existing = null;
	}
	const writeGeneration = existing
		? generation
		: captureCacheWriteGeneration(cache, resolvedUrl);

	if (
		existing &&
		canServeDocumentCacheEntry({
			cacheControl: existing.cacheControl,
			shared,
		}) &&
		evaluateFreshness({
			fetchedAt: existing.fetchedAt,
			ageSec: existing.ageSec,
			date: existing.date,
			cacheControl: existing.cacheControl,
			expires: existing.expires,
			shared,
			ttl,
		}) === "fresh"
	) {
		return {
			value: existing.data,
			share: isShareableCachedResponse({
				cacheControl: existing.cacheControl,
				shared,
			}),
		};
	}

	const result = await fetchXhrJson(resolvedUrl, {
		ifNoneMatch: existing?.etag,
		ifModifiedSince: existing?.lastModified,
	});
	if (result.notModified && existing) {
		const cacheControl = result.cacheControl ?? existing.cacheControl;
		await persistWarmDocument({
			cache,
			key,
			resolvedUrl,
			writeGeneration,
			data: existing.data,
			result,
			existing,
			reused: true,
			cacheControl,
			expires: result.expires ?? existing.expires,
			shared,
			ttl,
		});
		return {
			value: existing.data,
			share: isShareableCachedResponse({cacheControl, shared}),
		};
	}

	await persistWarmDocument({
		cache,
		key,
		resolvedUrl,
		writeGeneration,
		data: result.data,
		result,
		existing,
		reused: false,
		cacheControl: result.cacheControl,
		expires: result.expires,
		shared,
		ttl,
	});
	return {
		value: result.data,
		share: isShareableCachedResponse({
			cacheControl: result.cacheControl,
			shared,
		}),
	};
}

async function persistWarmDocument(input: {
	cache: FeatureSourceCache;
	key: string;
	resolvedUrl: string;
	writeGeneration: CacheWriteGeneration;
	data: FeatureSourceData | undefined;
	result: XhrJsonFetchResult;
	existing: FeatureSourceCacheEntry | null;
	reused: boolean;
	cacheControl?: string;
	expires?: string;
	shared: boolean;
	ttl?: Partial<CacheTtlPolicy>;
}): Promise<void> {
	const {
		cache,
		key,
		resolvedUrl,
		writeGeneration,
		data,
		result,
		existing,
		reused,
		cacheControl,
		expires,
		shared,
		ttl,
	} = input;
	await withDocumentCacheWrite(cache, async () => {
		if (
			!isCacheWriteGenerationCurrent(cache, resolvedUrl, writeGeneration)
		) {
			return;
		}
		if (
			!data ||
			!shouldPersistDocumentCache({
				cacheControl,
				expires,
				fetchedAt: result.fetchedAt,
				date: result.date,
				ageSec: result.ageSec,
				shared,
				ttl,
			})
		) {
			try {
				await cache.delete(key);
			} catch {
				// Optional adapter: warm still reports whether the
				// document is cached after this response.
			}
			return;
		}
		try {
			await cache.put(key, {
				data,
				fetchedAt: result.fetchedAt,
				ageSec: result.ageSec,
				date: result.date,
				bytes:
					reused && existing
						? existing.bytes
						: estimateFeatureSourceBytes(data),
				etag: result.etag ?? existing?.etag,
				lastModified: result.lastModified ?? existing?.lastModified,
				cacheControl,
				expires,
			});
		} catch {
			// Optional adapter: the fetched body still returns to
			// joined loads; warm reports persist via a later get.
		}
	});
}
