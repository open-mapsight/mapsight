import {describe, expect, it} from "vitest";

import type {MapsightUiFeature} from "../../types";
import {mapExtentFromFeature} from "./map-extent-from-feature";

describe("mapExtentFromFeature", () => {
	it("projects a point to a collapsed Web Mercator extent", () => {
		const extent = mapExtentFromFeature({
			type: "Feature",
			geometry: {type: "Point", coordinates: [10.52, 52.26]},
			properties: {},
		} as MapsightUiFeature);

		expect(extent).not.toBeNull();
		expect(extent?.[0]).toBeCloseTo(extent?.[2] ?? 0);
		expect(extent?.[1]).toBeCloseTo(extent?.[3] ?? 0);
		expect(extent?.[0]).toBeGreaterThan(1_000_000);
	});

	it("projects a bbox when present", () => {
		const extent = mapExtentFromFeature({
			type: "Feature",
			bbox: [10.5, 52.2, 10.6, 52.3],
			geometry: {type: "Point", coordinates: [10.52, 52.26]},
			properties: {},
		} as MapsightUiFeature);

		expect(extent).not.toBeNull();
		expect(extent?.[2]).toBeGreaterThan(extent?.[0] ?? 0);
		expect(extent?.[3]).toBeGreaterThan(extent?.[1] ?? 0);
	});

	it("returns null without locatable geometry", () => {
		expect(
			mapExtentFromFeature({
				type: "Feature",
				geometry: {type: "Point", coordinates: []},
				properties: {},
			} as MapsightUiFeature),
		).toBeNull();
	});
});
