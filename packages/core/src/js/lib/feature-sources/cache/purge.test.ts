import {describe, expect, it} from "vitest";

import {buildDocumentCacheKey} from "./build-cache-key";
import {createMemoryFeatureSourceCache} from "./memory-cache";
import {purgeDocumentCacheEntries} from "./purge";
import {
	captureCacheWriteGeneration,
	isCacheWriteGenerationCurrent,
} from "./single-flight";

const emptyCollection = {type: "FeatureCollection" as const, features: []};

async function putUrl(
	cache: ReturnType<typeof createMemoryFeatureSourceCache>,
	url: string,
	revision?: string,
) {
	const key = buildDocumentCacheKey({url, revision});
	await cache.put(key, {
		data: emptyCollection,
		fetchedAt: Date.now(),
		bytes: 8,
	});
}

describe("purgeDocumentCacheEntries", () => {
	it("deletes every revision of the given urls and leaves others", async () => {
		const cache = createMemoryFeatureSourceCache();
		const schools = "https://example.test/schools.geojson";
		const parks = "https://example.test/parks.geojson";
		await putUrl(cache, schools, "pub-1");
		await putUrl(cache, schools);
		await putUrl(cache, parks, "pub-1");

		await expect(
			purgeDocumentCacheEntries(cache, [schools]),
		).resolves.toEqual(
			expect.arrayContaining([
				buildDocumentCacheKey({url: schools, revision: "pub-1"}),
				buildDocumentCacheKey({url: schools}),
			]),
		);
		expect(cache.keys()).toEqual([
			buildDocumentCacheKey({url: parks, revision: "pub-1"}),
		]);
	});

	it("clears the adapter when no urls are given", async () => {
		const cache = createMemoryFeatureSourceCache();
		await putUrl(cache, "https://example.test/schools.geojson");
		await putUrl(cache, "https://example.test/parks.geojson");

		const deleted = await purgeDocumentCacheEntries(cache);
		expect(deleted).toHaveLength(2);
		expect(cache.keys()).toEqual([]);
	});

	it("rejects a later put from work started before the purge", async () => {
		const cache = createMemoryFeatureSourceCache();
		const url = "https://example.test/schools.geojson";
		const key = buildDocumentCacheKey({url, revision: "pub-1"});
		const generation = captureCacheWriteGeneration(cache, key);

		await purgeDocumentCacheEntries(cache, [url]);
		expect(isCacheWriteGenerationCurrent(cache, key, generation)).toBe(
			false,
		);
	});
});
