import {describe, expect, it} from "vitest";

import {
	combineFeatureSources,
	createCombinedFeatureSourceSelector,
} from "@/lib/feature-sources/lib/combined";

describe("combineFeatureSources", () => {
	it("merges features from member sources", () => {
		const result = combineFeatureSources(
			{
				a: {
					type: "xhr-json",
					data: {
						type: "FeatureCollection",
						features: [
							{
								id: "a1",
								properties: {},
								type: "Feature",
								geometry: {
									type: "Point",
									coordinates: [10, 10],
								},
							},
						],
					},
					lastUpdate: null,
					lastActionType: null,
				},
				b: {
					type: "xhr-json",
					data: {
						type: "FeatureCollection",
						features: [
							{
								id: "b1",
								properties: {},
								type: "Feature",
								geometry: {
									type: "Point",
									coordinates: [10, 10],
								},
							},
						],
					},
					lastUpdate: null,
					lastActionType: null,
				},
			},
			["a", "b"],
		);

		expect(result.features).toEqual([
			{
				id: "a1",
				properties: {},
				type: "Feature",
				geometry: {
					type: "Point",
					coordinates: [10, 10],
				},
			},
			{
				id: "b1",
				properties: {},
				type: "Feature",
				geometry: {
					type: "Point",
					coordinates: [10, 10],
				},
			},
		]);
	});

	it("returns an empty collection for an empty member list", () => {
		const result = combineFeatureSources({}, []);

		expect(result).toEqual({
			type: "FeatureCollection",
			features: [],
		});
	});

	it("skips errored or empty member sources", () => {
		const result = combineFeatureSources(
			{
				a: {
					type: "xhr-json",
					error: "failed",
					data: {
						type: "FeatureCollection",
						features: [
							{
								id: "a1",
								properties: {},
								type: "Feature",
								geometry: {
									type: "Point",
									coordinates: [10, 10],
								},
							},
						],
					},
					lastUpdate: null,
					lastActionType: null,
				},
				b: {
					type: "xhr-json",
					data: null,
					lastUpdate: null,
					lastActionType: null,
				},
			},
			["a", "b"],
		);

		expect(result.features).toEqual([]);
	});
});

describe("createCombinedFeatureSourceSelector", () => {
	it("reads member sources from the configured controller", () => {
		const selector = createCombinedFeatureSourceSelector(
			["a", "b"],
			"featureSources",
		);
		const result = selector({
			featureSources: {
				a: {
					type: "xhr-json",
					data: {
						type: "FeatureCollection",
						features: [
							{
								id: "a1",
								properties: {},
								type: "Feature",
								geometry: {
									type: "Point",
									coordinates: [10, 10],
								},
							},
						],
					},
					lastUpdate: null,
					lastActionType: null,
				},
				b: {
					type: "xhr-json",
					data: {
						type: "FeatureCollection",
						features: [
							{
								id: "b1",
								properties: {},
								type: "Feature",
								geometry: {
									type: "Point",
									coordinates: [10, 10],
								},
							},
						],
					},
					lastUpdate: null,
					lastActionType: null,
				},
			},
		});

		expect(result.data.features).toEqual([
			{
				id: "a1",
				properties: {},
				type: "Feature",
				geometry: {
					type: "Point",
					coordinates: [10, 10],
				},
			},
			{
				id: "b1",
				properties: {},
				type: "Feature",
				geometry: {
					type: "Point",
					coordinates: [10, 10],
				},
			},
		]);
	});
});
