import {describe, expect, it} from "vitest";

import {featureCollectionFeaturesKey} from "./featureCollectionFeaturesKey";

const placeFeature = {
	id: "place-1",
	type: "Feature",
	geometry: {type: "Point", coordinates: [10.5, 52.2]},
	properties: {name: "Parkhaus Eiermarkt", markerCaption: "207"},
};

describe("featureCollectionFeaturesKey", () => {
	it("ignores collection metadata such as buildTimestamp", () => {
		const first = featureCollectionFeaturesKey({
			type: "FeatureCollection",
			buildTimestamp: "2026-08-29T10:00:00Z",
			features: [placeFeature],
		});
		const second = featureCollectionFeaturesKey({
			type: "FeatureCollection",
			buildTimestamp: "2026-08-29T10:01:00Z",
			features: [placeFeature],
		});

		expect(first).toBeDefined();
		expect(first).toBe(second);
	});

	it("changes when a feature actually changes", () => {
		const before = featureCollectionFeaturesKey({
			features: [placeFeature],
		});
		const after = featureCollectionFeaturesKey({
			features: [
				{
					...placeFeature,
					properties: {
						...placeFeature.properties,
						markerCaption: "208",
					},
				},
			],
		});

		expect(before).not.toBe(after);
	});

	it("returns undefined when features are missing", () => {
		expect(featureCollectionFeaturesKey(undefined)).toBeUndefined();
		expect(featureCollectionFeaturesKey(null)).toBeUndefined();
		expect(featureCollectionFeaturesKey({})).toBeUndefined();
	});
});
