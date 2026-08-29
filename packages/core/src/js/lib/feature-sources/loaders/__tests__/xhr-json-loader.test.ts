import {afterEach, describe, expect, it, vi} from "vitest";

import {
	fetchXhrJson,
	load,
} from "@/lib/feature-sources/loaders/xhr-json-loader";

describe("xhr-json loader", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
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
});
