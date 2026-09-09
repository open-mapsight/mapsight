import {describe, expect, it} from "vitest";

import {
	buildDocumentCacheKey,
	documentCacheKeyMatchesUrl,
} from "./build-cache-key";
import {createMemoryFeatureSourceCache} from "./memory-cache";
import {purgeDocumentCacheEntries} from "./purge";
import {
	captureCacheWriteGeneration,
	isCacheWriteGenerationCurrent,
	withDocumentCacheWrite,
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

	it("drops per-url generation counters on a full purge", async () => {
		const cache = createMemoryFeatureSourceCache();
		const url = "https://example.test/schools.geojson";
		await putUrl(cache, url);
		await purgeDocumentCacheEntries(cache, [url]);
		const afterUrl = captureCacheWriteGeneration(cache, url);
		expect(afterUrl.url).toBeGreaterThan(0);

		await putUrl(cache, url);
		await purgeDocumentCacheEntries(cache);
		const afterAll = captureCacheWriteGeneration(cache, url);
		expect(afterAll.url).toBe(0);
		expect(afterAll.global).toBeGreaterThan(afterUrl.global);
	});

	it("rejects a later put from work started before the purge", async () => {
		const cache = createMemoryFeatureSourceCache();
		const url = "https://example.test/schools.geojson";
		const generation = captureCacheWriteGeneration(cache, url);

		await purgeDocumentCacheEntries(cache, [url]);
		expect(isCacheWriteGenerationCurrent(cache, url, generation)).toBe(
			false,
		);
	});

	it("busts writes even when the revision token contains colons", async () => {
		const cache = createMemoryFeatureSourceCache();
		const url = "https://example.test/schools.geojson";
		const revision = "2026-09-09T19:36:49Z";
		const generation = captureCacheWriteGeneration(cache, url);

		await purgeDocumentCacheEntries(cache, [url]);
		expect(isCacheWriteGenerationCurrent(cache, url, generation)).toBe(
			false,
		);
		expect(
			documentCacheKeyMatchesUrl(
				buildDocumentCacheKey({url, revision}),
				url,
			),
		).toBe(true);
	});

	it("resolves purge URLs before waiting on the write queue", async () => {
		const cache = createMemoryFeatureSourceCache();
		const globalWithBase = global as typeof globalThis & {
			baseUrl?: string;
		};
		globalWithBase.baseUrl = "https://a.example/";
		const relative = "/schools.geojson";
		const hostA = "https://a.example/schools.geojson";
		await putUrl(cache, hostA);

		let release: () => void = () => undefined;
		let entered: () => void = () => undefined;
		const enteredWrite = new Promise<void>((resolve) => {
			entered = resolve;
		});
		const blocked = withDocumentCacheWrite(cache, () => {
			entered();
			return new Promise<void>((resolve) => {
				release = resolve;
			});
		});
		await enteredWrite;
		const purging = purgeDocumentCacheEntries(cache, [relative]);
		globalWithBase.baseUrl = "https://b.example/";
		release();
		await blocked;
		await purging;
		delete globalWithBase.baseUrl;

		expect(cache.keys()).toEqual([]);
	});
});
