import {afterEach, describe, expect, it, vi} from "vitest";

import {buildDocumentCacheKey} from "./build-cache-key";
import {createMemoryFeatureSourceCache} from "./memory-cache";
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

	it("does not persist no-cache or sub-min TTL responses", async () => {
		const cache = createMemoryFeatureSourceCache();
		const fetchMock = vi.fn(() =>
			jsonResponse({"Cache-Control": "no-cache"}),
		);
		vi.stubGlobal("fetch", fetchMock);

		await expect(
			warmFeatureSourceUrl(cache, "/schools.geojson", undefined, {
				shared: false,
			}),
		).resolves.toBe(false);
		expect(cache.keys()).toEqual([]);

		fetchMock.mockImplementation(() =>
			jsonResponse({"Cache-Control": "max-age=1"}),
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
});
