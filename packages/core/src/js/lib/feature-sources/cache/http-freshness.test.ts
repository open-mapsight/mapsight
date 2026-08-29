import {describe, expect, it} from "vitest";

import {
	DEFAULT_CACHE_TTL,
	evaluateFreshness,
	parseCacheControl,
	shouldPersistDocumentCache,
} from "./http-freshness";

const fetchedAt = 1_000_000;

describe("parseCacheControl", () => {
	it("reads SWR, max-age, and must-revalidate", () => {
		expect(
			parseCacheControl(
				"max-age=60, stale-while-revalidate=120, must-revalidate",
			),
		).toMatchObject({
			maxAgeSec: 60,
			staleWhileRevalidateSec: 120,
			mustRevalidate: true,
		});
	});
});

describe("evaluateFreshness", () => {
	it("is fresh inside max-age", () => {
		expect(
			evaluateFreshness({
				fetchedAt,
				cacheControl: "max-age=60",
				now: fetchedAt + 10_000,
			}),
		).toBe("fresh");
	});

	it("uses stale-while-revalidate after max-age", () => {
		expect(
			evaluateFreshness({
				fetchedAt,
				cacheControl: "max-age=60, stale-while-revalidate=30",
				now: fetchedAt + 80_000,
			}),
		).toBe("stale-while-revalidate");
	});

	it("must-revalidate wins over SWR once stale", () => {
		expect(
			evaluateFreshness({
				fetchedAt,
				cacheControl:
					"max-age=60, stale-while-revalidate=30, must-revalidate",
				now: fetchedAt + 80_000,
			}),
		).toBe("must-revalidate");
	});

	it("treats no-cache as must-revalidate", () => {
		expect(
			evaluateFreshness({
				fetchedAt,
				cacheControl: "no-cache",
				now: fetchedAt + 1,
			}),
		).toBe("must-revalidate");
	});

	it("honors s-maxage and proxy-revalidate on shared caches", () => {
		expect(
			evaluateFreshness({
				fetchedAt,
				cacheControl: "max-age=3600, s-maxage=0, proxy-revalidate",
				now: fetchedAt + 1,
				shared: true,
			}),
		).toBe("must-revalidate");
		expect(
			evaluateFreshness({
				fetchedAt,
				cacheControl: "max-age=3600, s-maxage=0, proxy-revalidate",
				now: fetchedAt + 1,
				shared: false,
			}),
		).toBe("fresh");
	});

	it("uses the default TTL when freshness headers are missing", () => {
		expect(
			evaluateFreshness({
				fetchedAt,
				now: fetchedAt + 60_000,
			}),
		).toBe("fresh");
		expect(
			evaluateFreshness({
				fetchedAt,
				now: fetchedAt + DEFAULT_CACHE_TTL.defaultMs + 1,
			}),
		).toBe("stale");
	});

	it("caps origin max-age at the maximum TTL", () => {
		expect(
			evaluateFreshness({
				fetchedAt,
				cacheControl: "max-age=86400",
				now: fetchedAt + DEFAULT_CACHE_TTL.maxMs + 1,
			}),
		).toBe("stale");
	});
});

describe("shouldPersistDocumentCache", () => {
	it("skips documents whose origin lifetime is shorter than the minimum TTL", () => {
		expect(shouldPersistDocumentCache({cacheControl: "max-age=1"})).toBe(
			false,
		);
		expect(shouldPersistDocumentCache({cacheControl: "no-cache"})).toBe(
			false,
		);
	});

	it("keeps documents with no freshness headers or a long enough max-age", () => {
		expect(shouldPersistDocumentCache({})).toBe(true);
		expect(shouldPersistDocumentCache({cacheControl: "max-age=60"})).toBe(
			true,
		);
	});
});
