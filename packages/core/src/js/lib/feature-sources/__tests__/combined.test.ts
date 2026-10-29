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

describe("combined selector cache", () => {
	const feature = (id: string) => ({
		id,
		type: "Feature" as const,
		geometry: {type: "Point" as const, coordinates: [10, 10]},
		properties: {},
	});
	const source = (id: string) => ({
		type: "local" as const,
		data: {type: "FeatureCollection" as const, features: [feature(id)]},
		lastUpdate: null,
		lastActionType: null,
	});

	it("keeps the result on unrelated actions, loading flags and collection metadata", () => {
		const a = source("a1");
		const selector = createCombinedFeatureSourceSelector(["a"], "custom");
		const initial = selector({custom: {a}});
		expect(selector({custom: {a}, map: {zoom: 12}})).toBe(initial);
		expect(
			selector({
				custom: {a: {...a, isLoading: true}, other: source("other")},
			}),
		).toBe(initial);
		expect(
			selector({
				custom: {a: {...a, data: {...a.data, title: "updated"}}},
			}),
		).toBe(initial);
	});

	it("updates for edits, member removal, errors and recovery in member order", () => {
		const a = source("a1");
		const b = source("b1");
		const selector = createCombinedFeatureSourceSelector(
			["b", "a"],
			"sources",
		);
		const initial = selector({sources: {a, b}});
		expect(initial.data.features?.map(({id}) => id)).toEqual(["b1", "a1"]);

		const edited = {...a, data: {...a.data, features: [feature("a2")]}};
		const updated = selector({sources: {a: edited, b}});
		expect(updated).not.toBe(initial);
		expect(updated.data.features?.map(({id}) => id)).toEqual(["b1", "a2"]);

		const errored = selector({
			sources: {a: {...edited, error: "offline"}, b},
		});
		expect(errored.data.features).toEqual(b.data.features);
		expect(selector({sources: {a: edited, b}}).data.features).toEqual(
			updated.data.features,
		);
		expect(selector({sources: {b}}).data.features).toEqual(b.data.features);
		expect(selector({sources: {}}).data.features).toEqual([]);
	});

	it("does not share its cache across bindings or stores", () => {
		const first = createCombinedFeatureSourceSelector(["a"], "sources");
		const second = createCombinedFeatureSourceSelector(["b"], "sources");
		const state = {sources: {a: source("a1"), b: source("b1")}};
		const initial = first(state);
		expect(second(state).data.features).toEqual(
			state.sources.b.data.features,
		);
		expect(
			first({sources: {a: source("other-store")}}).data.features?.[0]?.id,
		).toBe("other-store");
		expect(first(state).data.features).toEqual(initial.data.features);
	});
});
