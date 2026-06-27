import {afterEach, describe, expect, it, vi} from "vitest";

import {load} from "@/lib/feature-sources/loaders/xhr-json-loader";

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
			})),
		);

		await expect(load({url: "/missing.geojson"})).rejects.toThrow(
			"HTTP 404 Not Found",
		);
	});
});
