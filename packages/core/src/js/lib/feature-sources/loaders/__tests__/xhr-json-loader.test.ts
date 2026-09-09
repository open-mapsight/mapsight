import {afterEach, describe, expect, it, vi} from "vitest";

import {
	XhrJsonHttpError,
	fetchXhrJson,
	load,
	resolveXhrJsonUrl,
} from "@/lib/feature-sources/loaders/xhr-json-loader";

describe("xhr-json loader", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it("rejects with an HTTP status when statusText is empty", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(() => ({
				ok: false,
				status: 404,
				statusText: "",
				headers: {get: () => null},
			})),
		);

		await expect(load({url: "/missing.geojson"})).rejects.toThrow(
			"HTTP 404",
		);
		await expect(load({url: "/missing.geojson"})).rejects.toMatchObject({
			status: 404,
		});
		await expect(load({url: "/missing.geojson"})).rejects.toBeInstanceOf(
			XhrJsonHttpError,
		);
	});

	it("includes statusText in the rejection message when present", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(() => ({
				ok: false,
				status: 404,
				statusText: "Not Found",
				headers: {get: () => null},
			})),
		);

		await expect(load({url: "/missing.geojson"})).rejects.toThrow(
			"HTTP 404 Not Found",
		);
	});

	it("sends validators and treats 304 as not modified", async () => {
		const fetchMock = vi.fn(() => ({
			ok: false,
			status: 304,
			statusText: "Not Modified",
			headers: {
				get(name: string) {
					if (name === "ETag") {
						return '"abc"';
					}
					return null;
				},
			},
		}));
		vi.stubGlobal("fetch", fetchMock);

		const result = await fetchXhrJson("/schools.geojson", {
			ifNoneMatch: '"abc"',
		});

		expect(result.notModified).toBe(true);
		expect(result.data).toBeUndefined();
		expect(fetchMock).toHaveBeenCalledWith(
			expect.stringContaining("/schools.geojson"),
			expect.objectContaining({
				headers: {"If-None-Match": '"abc"'},
			}),
		);
	});

	it("rejects an unsolicited 304 when no validator was sent", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(() => ({
				ok: false,
				status: 304,
				statusText: "Not Modified",
				headers: {get: () => null},
			})),
		);

		await expect(fetchXhrJson("/schools.geojson")).rejects.toMatchObject({
			status: 304,
		});
	});

	it("does not send validators on browser cross-origin requests", async () => {
		const fetchMock = vi.fn(() => ({
			ok: true,
			status: 200,
			statusText: "OK",
			headers: {get: () => null},
			json: () =>
				Promise.resolve({type: "FeatureCollection", features: []}),
		}));
		vi.stubGlobal("fetch", fetchMock);

		await fetchXhrJson("https://cdn.example/schools.geojson", {
			ifNoneMatch: '"abc"',
		});

		expect(fetchMock).toHaveBeenCalledWith(
			"https://cdn.example/schools.geojson",
			expect.objectContaining({
				headers: {},
			}),
		);
	});

	it("trims validator and freshness headers", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(() => ({
				ok: true,
				status: 200,
				statusText: "OK",
				headers: {
					get(name: string) {
						if (name === "ETag") {
							return '  "abc"  ';
						}
						if (name === "Cache-Control") {
							return "  max-age=60  ";
						}
						return null;
					},
				},
				json: () =>
					Promise.resolve({type: "FeatureCollection", features: []}),
			})),
		);

		const result = await fetchXhrJson("/schools.geojson");

		expect(result.etag).toBe('"abc"');
		expect(result.cacheControl).toBe("max-age=60");
	});

	it("returns Age and Date so freshness can account for CDN age", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(() => ({
				ok: true,
				status: 200,
				statusText: "OK",
				headers: {
					get(name: string) {
						if (name === "Age") {
							return "59";
						}
						if (name === "Date") {
							return "Wed, 09 Sep 2026 18:59:00 GMT";
						}
						return null;
					},
				},
				json: () =>
					Promise.resolve({type: "FeatureCollection", features: []}),
			})),
		);

		const result = await fetchXhrJson("/schools.geojson");
		expect(result.age).toBe("59");
		expect(result.date).toBe("Wed, 09 Sep 2026 18:59:00 GMT");
	});

	it("returns header receipt time as fetchedAt, not a later Date.now()", async () => {
		let now = 1_000;
		vi.spyOn(Date, "now").mockImplementation(() => now);
		vi.stubGlobal(
			"fetch",
			vi.fn(() => {
				now = 1_050;
				return {
					ok: true,
					status: 200,
					statusText: "OK",
					headers: {get: () => null},
					json: () => {
						now = 2_000;
						return Promise.resolve({
							type: "FeatureCollection",
							features: [],
						});
					},
				};
			}),
		);

		const result = await fetchXhrJson("/schools.geojson");
		expect(result.fetchedAt).toBe(1_050);
	});

	it("does not re-resolve an absolute URL when baseUrl changes", () => {
		const globalWithBase = global as typeof globalThis & {baseUrl?: string};
		globalWithBase.baseUrl = "https://a.example/";
		const resolved = resolveXhrJsonUrl("/schools.geojson");
		globalWithBase.baseUrl = "https://b.example/";
		expect(resolveXhrJsonUrl(resolved)).toBe(resolved);
		delete globalWithBase.baseUrl;
	});
});
