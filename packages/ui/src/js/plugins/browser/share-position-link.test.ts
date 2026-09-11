import {describe, expect, it} from "vitest";

import {markedPointSourceId} from "./marked-point";
import {
	buildLinkMarkerShareHref,
	formatLinkMarkerHash,
	parseLinkMarkerHash,
} from "./share-position-link";

describe("parseLinkMarkerHash", () => {
	it("reads lat/lon from the share hash", () => {
		expect(parseLinkMarkerHash("#lm=52.2647/10.5236")).toEqual({
			lat: 52.2647,
			lon: 10.5236,
		});
	});

	it("ignores a missing or unrelated hash", () => {
		expect(parseLinkMarkerHash("")).toBeNull();
		expect(parseLinkMarkerHash("#other=1")).toBeNull();
	});

	it("keeps near-zero coordinates in decimal form", () => {
		expect(formatLinkMarkerHash(0.000123, -0.000123)).toBe(
			"#lm=0.000123/-0.000123",
		);
		expect(parseLinkMarkerHash("#lm=0.000123/-0.000123")).toEqual({
			lat: 0.000123,
			lon: -0.000123,
		});
	});

	it("reads negative southern and western coordinates", () => {
		expect(parseLinkMarkerHash("#lm=-33.8688/-70.6693")).toEqual({
			lat: -33.8688,
			lon: -70.6693,
		});
		expect(
			parseLinkMarkerHash(formatLinkMarkerHash(-33.8688, -70.6693)),
		).toEqual({
			lat: -33.8688,
			lon: -70.6693,
		});
	});
});

describe("buildLinkMarkerShareHref", () => {
	it("writes the same #lm hash as the overlay tool", () => {
		expect(formatLinkMarkerHash(52.2647, 10.5236)).toBe(
			"#lm=52.2647/10.5236",
		);
		expect(
			buildLinkMarkerShareHref(52.2647, 10.5236, {
				origin: "https://example.de",
				pathname: "/plan",
				search: "?module=home",
			}),
		).toBe("https://example.de/plan?module=home#lm=52.2647/10.5236");
	});
});

describe("share-position-link source", () => {
	it("writes the hash marker into the same source as draw and mark", () => {
		expect(markedPointSourceId("sharePositionLink")).toBe(
			"sharePositionLink_featureSource",
		);
	});
});
