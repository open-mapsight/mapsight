import {afterEach, describe, expect, it, vi} from "vitest";

import {buildDocumentCacheKey} from "./build-cache-key";
import {createMemoryFeatureSourceCache} from "./memory-cache";
import {purgeDocumentCacheEntries} from "./purge";
import {warmFeatureSourceUrl} from "./warm";

const collection = {
	type: "FeatureCollection" as const,
	features: [],
};

function jsonResponse(headers: Record<string, string> = {}) {
	return {
		ok: true,
		status: 200,
		headers: {
			get(name: string) {
				return headers[name] ?? null;
			},
		},
		json: () => Promise.resolve(collection),
	};
}

describe("warmFeatureSourceUrl", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("persists a fresh xhr-json document", async () => {
		const cache = createMemoryFeatureSourceCache();
		vi.stubGlobal(
			"fetch",
			vi.fn(() => jsonResponse({"Cache-Control": "max-age=60"})),
		);

		await expect(
			warmFeatureSourceUrl(cache, "/schools.geojson", "rev-1", {
				shared: false,
			}),
		).resolves.toBe(true);

		const key = buildDocumentCacheKey({
			url: "/schools.geojson",
			revision: "rev-1",
		});
		expect((await cache.get(key))?.data).toEqual(collection);
	});

	it("persists no-cache documents for later revalidation", async () => {
		const cache = createMemoryFeatureSourceCache();
		vi.stubGlobal(
			"fetch",
			vi.fn(() => jsonResponse({"Cache-Control": "no-cache, max-age=0"})),
		);

		await expect(
			warmFeatureSourceUrl(cache, "/schools.geojson", undefined, {
				shared: false,
			}),
		).resolves.toBe(true);
		expect(cache.keys()).toHaveLength(1);
	});

	it("does not persist sub-min TTL responses", async () => {
		const cache = createMemoryFeatureSourceCache();
		vi.stubGlobal(
			"fetch",
			vi.fn(() => jsonResponse({"Cache-Control": "max-age=1"})),
		);

		await expect(
			warmFeatureSourceUrl(cache, "/parks.geojson", undefined, {
				shared: false,
			}),
		).resolves.toBe(false);
		expect(cache.keys()).toEqual([]);
	});

	it("honors s-maxage on shared caches", async () => {
		const cache = createMemoryFeatureSourceCache();
		vi.stubGlobal(
			"fetch",
			vi.fn(() =>
				jsonResponse({
					"Cache-Control": "max-age=3600, s-maxage=0",
				}),
			),
		);

		await expect(
			warmFeatureSourceUrl(cache, "/schools.geojson", undefined, {
				shared: true,
			}),
		).resolves.toBe(false);
		expect(cache.keys()).toEqual([]);

		await expect(
			warmFeatureSourceUrl(cache, "/schools.geojson", undefined, {
				shared: false,
			}),
		).resolves.toBe(true);
		expect(cache.keys()).toHaveLength(1);
	});

	it("does not persist private responses in a shared cache", async () => {
		const cache = createMemoryFeatureSourceCache();
		vi.stubGlobal(
			"fetch",
			vi.fn(() => jsonResponse({"Cache-Control": "max-age=60, private"})),
		);

		await expect(
			warmFeatureSourceUrl(cache, "/schools.geojson", undefined, {
				shared: true,
			}),
		).resolves.toBe(false);
		expect(cache.keys()).toEqual([]);
	});

	it("does not keep a delayed put after purge", async () => {
		const inner = createMemoryFeatureSourceCache();
		let releasePut: () => void = () => undefined;
		const putGate = new Promise<void>((resolve) => {
			releasePut = resolve;
		});
		let putEntered: () => void = () => undefined;
		const putStarted = new Promise<void>((resolve) => {
			putEntered = resolve;
		});
		const cache = {
			get: inner.get.bind(inner),
			async put(
				...args: Parameters<typeof inner.put>
			): ReturnType<typeof inner.put> {
				putEntered();
				await putGate;
				return inner.put(...args);
			},
			delete: inner.delete.bind(inner),
			estimateTotalBytes: inner.estimateTotalBytes.bind(inner),
			evictLRU: inner.evictLRU.bind(inner),
			keys: inner.keys.bind(inner),
		};
		vi.stubGlobal(
			"fetch",
			vi.fn(() => jsonResponse({"Cache-Control": "max-age=60"})),
		);

		const url = "/schools.geojson";
		const warming = warmFeatureSourceUrl(cache, url, "rev-1", {
			shared: false,
		});
		await putStarted;
		const purged = purgeDocumentCacheEntries(cache, [url]);
		releasePut();
		await warming;
		await purged;
		expect(cache.keys()).toEqual([]);
	});

	it("single-flights concurrent warm of the same cold key", async () => {
		const cache = createMemoryFeatureSourceCache();
		let resolveFetch: (
			value: ReturnType<typeof jsonResponse>,
		) => void = () => undefined;
		const fetchStarted = new Promise<void>((resolveStarted) => {
			vi.stubGlobal(
				"fetch",
				vi.fn(
					() =>
						new Promise((resolve) => {
							resolveStarted();
							resolveFetch = resolve;
						}),
				),
			);
		});

		const first = warmFeatureSourceUrl(cache, "/schools.geojson", "rev-1", {
			shared: false,
		});
		await fetchStarted;
		const second = warmFeatureSourceUrl(
			cache,
			"/schools.geojson",
			"rev-1",
			{shared: false},
		);
		resolveFetch(jsonResponse({"Cache-Control": "max-age=60"}));
		await expect(Promise.all([first, second])).resolves.toEqual([
			true,
			true,
		]);
		expect(fetch).toHaveBeenCalledOnce();
	});

	it("revalidates a stale stored document instead of publishing it", async () => {
		const cache = createMemoryFeatureSourceCache();
		const key = buildDocumentCacheKey({
			url: "/schools.geojson",
			revision: "rev-1",
		});
		await cache.put(key, {
			data: collection,
			fetchedAt: Date.now() - 120_000,
			bytes: 8,
			etag: '"v1"',
			cacheControl: "max-age=60",
		});
		vi.stubGlobal(
			"fetch",
			vi.fn(() => jsonResponse({"Cache-Control": "max-age=60"})),
		);

		await expect(
			warmFeatureSourceUrl(cache, "/schools.geojson", "rev-1", {
				shared: false,
			}),
		).resolves.toBe(true);
		expect(fetch).toHaveBeenCalledOnce();
	});

	it("does not share a private response across concurrent shared warms", async () => {
		const cache = createMemoryFeatureSourceCache();
		vi.stubGlobal(
			"fetch",
			vi.fn(() => jsonResponse({"Cache-Control": "max-age=60, private"})),
		);

		const first = warmFeatureSourceUrl(cache, "/schools.geojson", "rev-1", {
			shared: true,
		});
		const second = warmFeatureSourceUrl(
			cache,
			"/schools.geojson",
			"rev-1",
			{shared: true},
		);
		await expect(Promise.all([first, second])).resolves.toEqual([
			false,
			false,
		]);
		expect(fetch).toHaveBeenCalledTimes(2);
		expect(cache.keys()).toEqual([]);
	});
});
