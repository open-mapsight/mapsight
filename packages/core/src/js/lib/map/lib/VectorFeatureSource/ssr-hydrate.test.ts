import type Feature from "ol/Feature";

import {describe, expect, it} from "vitest";

import {
	HIGHLIGHT_TEST_COORD,
	HIGHLIGHT_TEST_FEATURE_ID,
	createHighlightTestMap,
} from "@/test/create-highlight-test-map";

describe("SSR-hydrated VectorFeatureSource", () => {
	it("puts preloaded store features onto the OpenLayers source", () => {
		const {layer, mapController, target} = createHighlightTestMap({
			stubHits: false,
			hydrateFeatureCollection: {
				type: "FeatureCollection",
				features: [
					{
						id: HIGHLIGHT_TEST_FEATURE_ID,
						type: "Feature",
						properties: {name: "Parkhaus Eiermarkt"},
						geometry: {
							type: "Point",
							coordinates: HIGHLIGHT_TEST_COORD,
						},
					},
				],
			},
		});

		try {
			const source = (
				layer as unknown as {
					getSource: () => {getFeatures: () => Array<Feature>};
				}
			).getSource();
			const ids = source
				.getFeatures()
				.map((feature) => String(feature.getId()));

			expect(ids).toContain(HIGHLIGHT_TEST_FEATURE_ID);
		} finally {
			mapController.unmount();
			target.remove();
		}
	});
});
