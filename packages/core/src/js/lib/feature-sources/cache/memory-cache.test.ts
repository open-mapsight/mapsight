import {describe, expect, it} from "vitest";

import {createMemoryFeatureSourceCache} from "./memory-cache";

const collection = {
	type: "FeatureCollection" as const,
	features: [
		{
			id: "a",
			type: "Feature" as const,
			properties: {},
			geometry: {type: "Point" as const, coordinates: [1, 2]},
		},
	],
};

describe("createMemoryFeatureSourceCache", () => {
	it("round-trips a parsed FeatureCollection", async () => {
		const cache = createMemoryFeatureSourceCache();
		await cache.put("doc::/a.geojson", {
			data: collection,
			fetchedAt: 100,
			bytes: 0,
		});

		const entry = await cache.get("doc::/a.geojson");
		expect(entry?.tier).toBe("memory");
		expect(entry?.data).toEqual(collection);
		expect(entry?.bytes).toBeGreaterThan(0);
	});

	it("evicts least-recently used entries down to a byte target", async () => {
		const cache = createMemoryFeatureSourceCache();
		await cache.put("old", {
			data: collection,
			fetchedAt: 1,
			bytes: 100,
		});
		await cache.put("new", {
			data: collection,
			fetchedAt: 2,
			bytes: 100,
		});
		await cache.get("new");

		const evicted = await cache.evictLRU(100);
		expect(evicted).toEqual(["old"]);
		expect(await cache.get("old")).toBeNull();
		expect(await cache.get("new")).not.toBeNull();
	});
});
