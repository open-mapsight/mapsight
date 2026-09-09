import {describe, expect, it} from "vitest";

import {
	featureCollectionFeaturesKey,
	nextFeatureCollectionFeaturesKey,
} from "./features-key";

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

	it("does not retain the stringified features array", () => {
		const features = Array.from({length: 40}, (_, index) => ({
			...placeFeature,
			id: `place-${index}`,
			properties: {
				...placeFeature.properties,
				name: `Place ${index}`,
			},
		}));
		const json = JSON.stringify(features);
		const key = featureCollectionFeaturesKey({features});

		expect(key).toMatch(/^[0-9a-z]+$/);
		expect(key?.length).toBeLessThan(20);
		expect(json.length).toBeGreaterThan(1000);
	});

	it("changes when the collection crs changes", () => {
		const features = [placeFeature];
		const withoutCrs = featureCollectionFeaturesKey({features});
		const withCrs = featureCollectionFeaturesKey({
			features,
			crs: {type: "name", properties: {name: "EPSG:25832"}},
		});

		expect(withoutCrs).toBeDefined();
		expect(withCrs).not.toBe(withoutCrs);
	});

	it("hashes on count change so the next metadata-only poll can skip", () => {
		const twoFeatures = {
			features: [placeFeature, {...placeFeature, id: "place-2"}],
		};
		const afterCountChange = nextFeatureCollectionFeaturesKey(twoFeatures);
		const laterMetadataPoll = nextFeatureCollectionFeaturesKey(twoFeatures);

		expect(afterCountChange.key).toBe(
			featureCollectionFeaturesKey(twoFeatures),
		);
		expect(afterCountChange.key).toBe(laterMetadataPoll.key);
		expect(afterCountChange.count).toBe(2);
	});
});
