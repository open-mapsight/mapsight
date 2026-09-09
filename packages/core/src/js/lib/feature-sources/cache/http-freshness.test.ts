import {describe, expect, it} from "vitest";

import {
	DEFAULT_CACHE_TTL,
	allowsStaleOnError,
	correctedInitialAgeSec,
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

	it("ignores malformed delta-seconds", () => {
		expect(parseCacheControl("max-age=60junk").maxAgeSec).toBeUndefined();
	});

	it("reads private", () => {
		expect(parseCacheControl("max-age=60, private")).toMatchObject({
			maxAgeSec: 60,
			isPrivate: true,
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

	it("treats s-maxage as proxy-revalidate on shared caches once stale", () => {
		expect(
			evaluateFreshness({
				fetchedAt,
				cacheControl:
					"max-age=60, s-maxage=60, stale-while-revalidate=30",
				now: fetchedAt + 80_000,
				shared: true,
			}),
		).toBe("must-revalidate");
		expect(
			evaluateFreshness({
				fetchedAt,
				cacheControl:
					"max-age=60, s-maxage=60, stale-while-revalidate=30",
				now: fetchedAt + 80_000,
				shared: false,
			}),
		).toBe("stale-while-revalidate");
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

	it("includes Age in current age so CDN-aged responses are not treated as new", () => {
		expect(
			evaluateFreshness({
				fetchedAt,
				ageSec: 59,
				cacheControl: "max-age=60",
				now: fetchedAt + 2_000,
			}),
		).toBe("stale");
		expect(
			evaluateFreshness({
				fetchedAt,
				ageSec: 59,
				cacheControl: "max-age=60",
				now: fetchedAt,
			}),
		).toBe("fresh");
	});

	it("uses Expires minus Date, not fetchedAt minus Age", () => {
		expect(
			evaluateFreshness({
				fetchedAt: Date.parse("Wed, 09 Sep 2026 19:00:00 GMT"),
				ageSec: 59,
				date: "Wed, 09 Sep 2026 19:00:00 GMT",
				expires: "Wed, 09 Sep 2026 19:01:00 GMT",
				now: Date.parse("Wed, 09 Sep 2026 19:00:00 GMT") + 2_000,
			}),
		).toBe("stale");
	});

	it("must-revalidate private responses on shared caches", () => {
		expect(
			evaluateFreshness({
				fetchedAt,
				cacheControl: "max-age=60, private",
				now: fetchedAt + 1,
				shared: true,
			}),
		).toBe("must-revalidate");
		expect(
			evaluateFreshness({
				fetchedAt,
				cacheControl: "max-age=60, private",
				now: fetchedAt + 1,
				shared: false,
			}),
		).toBe("fresh");
	});
});

describe("shouldPersistDocumentCache", () => {
	it("skips documents whose origin lifetime is shorter than the minimum TTL", () => {
		expect(shouldPersistDocumentCache({cacheControl: "max-age=1"})).toBe(
			false,
		);
	});

	it("does not persist no-store", () => {
		expect(shouldPersistDocumentCache({cacheControl: "no-store"})).toBe(
			false,
		);
	});

	it("persists no-cache so later loads can revalidate", () => {
		expect(shouldPersistDocumentCache({cacheControl: "no-cache"})).toBe(
			true,
		);
		expect(
			shouldPersistDocumentCache({cacheControl: "no-cache, max-age=0"}),
		).toBe(true);
	});

	it("uses the response Date for Expires persist lifetime", () => {
		expect(
			shouldPersistDocumentCache({
				expires: "Wed, 09 Sep 2026 19:01:00 GMT",
				date: "Wed, 09 Sep 2026 19:00:00 GMT",
				fetchedAt: Date.parse("Wed, 09 Sep 2026 19:00:55 GMT"),
			}),
		).toBe(true);
		expect(
			shouldPersistDocumentCache({
				expires: "Wed, 09 Sep 2026 19:01:00 GMT",
				fetchedAt: Date.parse("Wed, 09 Sep 2026 19:00:55 GMT"),
			}),
		).toBe(false);
	});

	it("keeps documents with no freshness headers or a long enough max-age", () => {
		expect(shouldPersistDocumentCache({})).toBe(true);
		expect(shouldPersistDocumentCache({cacheControl: "max-age=60"})).toBe(
			true,
		);
	});

	it("does not persist private responses in a shared cache", () => {
		expect(
			shouldPersistDocumentCache({
				cacheControl: "max-age=60, private",
				shared: true,
			}),
		).toBe(false);
		expect(
			shouldPersistDocumentCache({
				cacheControl: "max-age=60, private",
				shared: false,
			}),
		).toBe(true);
	});
});

describe("allowsStaleOnError", () => {
	it("extends stale-if-error from the freshness lifetime, not from fetch", () => {
		expect(
			allowsStaleOnError({
				fetchedAt,
				cacheControl: "max-age=60, stale-if-error=3600",
				now: fetchedAt + 3_650_000,
			}),
		).toBe(true);
		expect(
			allowsStaleOnError({
				fetchedAt,
				cacheControl: "max-age=60, stale-if-error=3600",
				now: fetchedAt + 3_670_000,
			}),
		).toBe(false);
	});
});

describe("correctedInitialAgeSec", () => {
	it("uses the greater of Age and apparent age from Date", () => {
		const now = Date.parse("Wed, 09 Sep 2026 19:00:00 GMT");
		expect(
			correctedInitialAgeSec({
				ageHeader: "10",
				dateHeader: "Wed, 09 Sep 2026 18:59:00 GMT",
				now,
			}),
		).toBe(60);
		expect(correctedInitialAgeSec({ageHeader: "59"})).toBe(59);
		expect(
			correctedInitialAgeSec({
				ageHeader: "0",
				requestTime: 1_000,
				responseTime: 6_000,
			}),
		).toBe(5);
	});
});
