import {describe, expect, it, vi} from "vitest";

import {
	fetchNearestAddress,
	formatNearestAddress,
	nearestAddressUrl,
} from "./nearest-address";

describe("formatNearestAddress", () => {
	it("joins street, number, and city like geo-search", () => {
		expect(
			formatNearestAddress({
				name: "Burgplatz",
				nummer: 2,
				zusatz: "",
				plz: 38100,
				ort: "Braunschweig",
				distance: 29.1,
			}),
		).toEqual({
			name: "Burgplatz 2",
			listInformation: "38100 Braunschweig",
		});
	});

	it("escapes markup only in list information", () => {
		expect(
			formatNearestAddress({
				name: "Burgplatz & Markt",
				nummer: "2",
				plz: "38100",
				ort: "<img src=x onerror=alert(1)>",
			}),
		).toEqual({
			name: "Burgplatz & Markt 2",
			listInformation: "38100 &lt;img src=x onerror=alert(1)&gt;",
		});
	});

	it("returns null without a street name", () => {
		expect(formatNearestAddress({nummer: "1"})).toBeNull();
		expect(formatNearestAddress(null)).toBeNull();
	});
});

describe("nearestAddressUrl", () => {
	it("keeps a same-origin path and adds lat/lon", () => {
		expect(
			nearestAddressUrl("/mapsight/geo-search/nearest.php", 52.26, 10.52),
		).toBe("/mapsight/geo-search/nearest.php?lat=52.26&lon=10.52");
	});
});

describe("fetchNearestAddress", () => {
	it("returns the closest hit", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				json: () =>
					Promise.resolve([
						{
							name: "Bohlweg",
							nummer: "1",
							plz: "38100",
							ort: "Braunschweig",
						},
						{
							name: "Bohlweg",
							nummer: "3",
							plz: "38100",
							ort: "Braunschweig",
						},
					]),
			}),
		);

		await expect(
			fetchNearestAddress(
				"/mapsight/geo-search/nearest.php",
				52.26,
				10.52,
			),
		).resolves.toEqual({
			name: "Bohlweg 1",
			listInformation: "38100 Braunschweig",
		});

		vi.unstubAllGlobals();
	});
});
