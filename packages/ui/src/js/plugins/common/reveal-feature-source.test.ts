import {describe, expect, it, vi} from "vitest";

import {
	allowlistedFeatureSourceId,
	parseFeatureSourceSearchParam,
	permalinkSourceId,
	revealFeatureSource,
	sanitizeFeatureSourceId,
} from "./reveal-feature-source";

describe("sanitizeFeatureSourceId", () => {
	it("accepts stable catalog slugs", () => {
		expect(sanitizeFeatureSourceId("museen")).toBe("museen");
		expect(sanitizeFeatureSourceId("Kultur_2")).toBe("Kultur_2");
	});

	it("rejects URLs, paths, and empty values", () => {
		expect(sanitizeFeatureSourceId("https://evil.example/x")).toBeNull();
		expect(sanitizeFeatureSourceId("../etc/passwd")).toBeNull();
		expect(sanitizeFeatureSourceId("museen.json")).toBeNull();
		expect(sanitizeFeatureSourceId("")).toBeNull();
		expect(sanitizeFeatureSourceId("  ")).toBeNull();
	});
});

describe("allowlistedFeatureSourceId", () => {
	it("requires the id to exist in the current catalog", () => {
		expect(allowlistedFeatureSourceId("museen", ["museen", "kultur"])).toBe(
			"museen",
		);
		expect(allowlistedFeatureSourceId("museen", ["kultur"])).toBeNull();
		expect(
			allowlistedFeatureSourceId("https://x", ["https://x"]),
		).toBeNull();
	});
});

describe("parseFeatureSourceSearchParam", () => {
	it("reads a sanitized src param", () => {
		expect(parseFeatureSourceSearchParam("?module=home&src=museen")).toBe(
			"museen",
		);
		expect(parseFeatureSourceSearchParam("module=home")).toBeNull();
		expect(
			parseFeatureSourceSearchParam("?src=https://evil.example"),
		).toBeNull();
		expect(
			parseFeatureSourceSearchParam("?feature=x&src=%E0%A4%A"),
		).toBeNull();
	});
});

describe("permalinkSourceId", () => {
	it("omits ids implied by the landing view", () => {
		expect(permalinkSourceId("museen", ["kultur"])).toBe("museen");
		expect(permalinkSourceId("museen", ["museen", "kultur"])).toBeNull();
		expect(permalinkSourceId("searchResult", ["museen"])).toBe(
			"searchResult",
		);
	});
});

describe("revealFeatureSource", () => {
	it("loads an allowlisted source and turns its layer on", () => {
		const dispatch = vi.fn();
		const store = {
			dispatch,
			getState: () => ({
				featureSources: {
					museen: {type: "xhr-json", url: "/museen.json"},
				},
				map: {
					layers: {
						museen: {options: {visible: false}},
					},
				},
			}),
			subscribe: () => () => undefined,
		};

		expect(revealFeatureSource(store, "museen")).toBe(true);
		expect(dispatch).toHaveBeenCalled();
		expect(
			dispatch.mock.calls.some((call) => {
				const action = call[0] as {
					meta?: {path?: unknown[]};
					value?: unknown;
				};
				return (
					Array.isArray(action.meta?.path) &&
					action.meta.path.includes("visible") &&
					action.value === true
				);
			}),
		).toBe(true);
	});

	it("does not reload a source that already has features", () => {
		const dispatch = vi.fn();
		const store = {
			dispatch,
			getState: () => ({
				featureSources: {
					museen: {
						type: "xhr-json",
						url: "/museen.json",
						data: {type: "FeatureCollection", features: []},
						ids: ["rathaus"],
					},
				},
				map: {
					layers: {
						museen: {options: {visible: false}},
					},
				},
			}),
			subscribe: () => () => undefined,
		};

		expect(revealFeatureSource(store, "museen")).toBe(true);
		expect(dispatch).toHaveBeenCalledTimes(1);
		expect(
			(dispatch.mock.calls[0]?.[0] as {meta?: {path?: unknown[]}}).meta
				?.path,
		).toContain("visible");
	});

	it("ignores unknown catalog ids", () => {
		const dispatch = vi.fn();
		const store = {
			dispatch,
			getState: () => ({
				featureSources: {kultur: {type: "xhr-json"}},
				map: {layers: {}},
			}),
			subscribe: () => () => undefined,
		};

		expect(revealFeatureSource(store, "museen")).toBe(false);
		expect(dispatch).not.toHaveBeenCalled();
	});
});
