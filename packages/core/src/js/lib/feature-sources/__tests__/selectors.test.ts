import {describe, expect, it} from "vitest";

import {
	STATUS_ERROR,
	STATUS_OK,
	createFilteredFeatureSourceSelector,
	findFeatureInFeatureSourcesById,
	getFeatureSourceStatus,
	hasFeatureSourceLoadError,
} from "@/lib/feature-sources/selectors";
import type {FeatureSourcesState} from "@/lib/feature-sources/types";
import {addFilterFunction} from "@/lib/filter/selectors";
import type {Feature, State} from "@/types";

const visibleFeature = {
	id: "visible",
	type: "Feature",
	geometry: {
		type: "Point",
		coordinates: [10, 10],
	},
	properties: {visible: true},
} satisfies Feature;

const hiddenFeature = {
	id: "hidden",
	type: "Feature",
	geometry: {
		type: "Point",
		coordinates: [20, 20],
	},
	properties: {visible: false},
} satisfies Feature;

const featureSources = {
	places: {
		type: "local",
		filters: ["testVisibleOnly"],
		data: {
			type: "FeatureCollection",
			features: [visibleFeature, hiddenFeature],
		},
		ids: ["visible", "hidden"],
		featuresById: {
			visible: visibleFeature,
			hidden: hiddenFeature,
		},
		lastUpdate: null,
		lastActionType: null,
	},
} satisfies FeatureSourcesState;

describe("feature source selectors", () => {
	it("treats empty error strings as failed loads", () => {
		expect(hasFeatureSourceLoadError({error: ""} as never)).toBe(true);
		expect(
			getFeatureSourceStatus({
				error: "",
				isLoading: false,
			} as never),
		).toBe(STATUS_ERROR);
		expect(
			getFeatureSourceStatus({
				isLoading: false,
			} as never),
		).toBe(STATUS_OK);
	});

	it("finds features through the feature source id index", () => {
		expect(findFeatureInFeatureSourcesById(featureSources, "visible")).toBe(
			visibleFeature,
		);
		expect(
			findFeatureInFeatureSourcesById(featureSources, "missing"),
		).toBeNull();
	});

	it("keeps filtered data and derived indexes in sync", () => {
		addFilterFunction("testVisibleOnly", (features) =>
			features.filter((feature) => feature.properties.visible),
		);
		const selector = createFilteredFeatureSourceSelector(
			"featureSources",
			"places",
		);

		const result = selector({
			featureSources,
			testVisibleOnly: true,
		} satisfies State);

		expect(result?.data?.features).toEqual([visibleFeature]);
		expect(result?.ids).toEqual(["visible"]);
		expect(result?.featuresById).toEqual({visible: visibleFeature});
	});

	it("reuses the previous filtered state when only collection metadata changed", () => {
		const selector = createFilteredFeatureSourceSelector(
			"featureSources",
			"places",
		);
		const featuresKey = "same-features";
		const firstState = {
			featureSources: {
				places: {
					...featureSources.places,
					featuresKey,
					lastUpdate: 1,
				},
			},
		} satisfies State;
		const secondState = {
			featureSources: {
				places: {
					...featureSources.places,
					featuresKey,
					lastUpdate: 2,
					isLoading: true,
				},
			},
		} satisfies State;

		const first = selector(firstState);
		const second = selector(secondState);

		expect(second).not.toBe(first);
		expect(second?.data).toBe(first?.data);
		expect(second?.ids).toEqual(first?.ids);
		expect(second?.isLoading).toBe(true);
		expect(first?.isLoading).not.toBe(true);
	});

	it("forwards load errors when the features fingerprint is unchanged", () => {
		const selector = createFilteredFeatureSourceSelector(
			"featureSources",
			"places",
		);
		const featuresKey = "same-features";
		selector({
			featureSources: {
				places: {
					...featureSources.places,
					featuresKey,
				},
			},
		} satisfies State);

		const failed = selector({
			featureSources: {
				places: {
					...featureSources.places,
					featuresKey,
					error: "timeout",
					isLoading: false,
				},
			},
		} satisfies State);

		expect(failed?.error).toBe("timeout");
		expect(failed?.data?.features).toEqual([visibleFeature]);
		expect(failed?.isLoading).toBe(false);
	});

	it("reapplies filters when their configured order changes", () => {
		addFilterFunction("testTakeFirst", (features) => features.slice(0, 1));
		addFilterFunction("testTakeLast", (features) => features.slice(-1));
		const selector = createFilteredFeatureSourceSelector(
			"featureSources",
			"places",
		);
		const featuresKey = "same-features";
		const first = selector({
			featureSources: {
				places: {
					...featureSources.places,
					featuresKey,
					filters: ["testTakeFirst", "testTakeLast"],
				},
			},
		} satisfies State);
		const reordered = selector({
			featureSources: {
				places: {
					...featureSources.places,
					featuresKey,
					filters: ["testTakeLast", "testTakeFirst"],
				},
			},
		} satisfies State);

		expect(first?.data?.features).toEqual([visibleFeature]);
		expect(reordered?.data?.features).toEqual([hiddenFeature]);
	});
});
