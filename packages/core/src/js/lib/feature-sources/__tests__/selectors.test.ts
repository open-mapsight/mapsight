import {describe, expect, it} from "vitest";

import {
	createFilteredFeatureSourceSelector,
	findFeatureInFeatureSourcesById,
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
});
