import {describe, expect, it} from "vitest";

import {parsePurgeUrls, runPurge} from "./purge.ts";

describe("parsePurgeUrls", () => {
	it("treats empty body and missing urls as clear-all", () => {
		expect(parsePurgeUrls("")).toBeUndefined();
		expect(parsePurgeUrls("{}")).toBeUndefined();
		expect(parsePurgeUrls("  ")).toBeUndefined();
		expect(parsePurgeUrls('{"urls":[]}')).toEqual([]);
	});

	it("keeps absolute GeoJSON URLs and drops blanks", () => {
		expect(
			parsePurgeUrls(
				JSON.stringify({
					urls: [
						"https://maps.example.test/geojson/schools.geojson",
						"  ",
						"https://www.example.test/mapsight/pulp/result/parking.geojson",
					],
				}),
			),
		).toEqual([
			"https://maps.example.test/geojson/schools.geojson",
			"https://www.example.test/mapsight/pulp/result/parking.geojson",
		]);
	});

	it("rejects invalid JSON and non-string urls", () => {
		expect(() => parsePurgeUrls("{")).toThrow(
			expect.objectContaining({statusCode: 400}),
		);
		expect(() => parsePurgeUrls("[]")).toThrow(
			expect.objectContaining({statusCode: 400}),
		);
		expect(() =>
			parsePurgeUrls('{"urls":"https://example.test/a.geojson"}'),
		).toThrow(expect.objectContaining({statusCode: 400}));
		expect(() => parsePurgeUrls('{"urls":[1]}')).toThrow(
			expect.objectContaining({statusCode: 400}),
		);
	});
});

describe("runPurge", () => {
	it("omits urls for clear-all and passes listed URLs through", async () => {
		const calls: Array<string[] | undefined> = [];
		const purge = (urls?: string[]) => {
			calls.push(urls);
			return urls ?? ["doc::all"];
		};

		expect(await runPurge(purge, undefined)).toEqual(["doc::all"]);
		expect(await runPurge(purge, [])).toEqual(["doc::all"]);
		expect(
			await runPurge(purge, ["https://example.test/a.geojson"]),
		).toEqual(["https://example.test/a.geojson"]);
		expect(calls).toEqual([
			undefined,
			undefined,
			["https://example.test/a.geojson"],
		]);
	});
});
