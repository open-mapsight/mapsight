import {afterEach, describe, expect, it, vi} from "vitest";

import {set} from "@mapsight/core/lib/base/actions";
import {removeFeatureSource} from "@mapsight/core/lib/feature-sources/actions";
import {setLayerVisibility} from "@mapsight/core/lib/map/actions";

import nodeEmbed from "../../embed/node";
import createCombinedVisibleLayersPlugin from "./combined-visible-layers";

const layer = (visible: boolean) => ({
	type: "TileLayer",
	options: {visible},
});

function embedWithCombinedSource() {
	vi.spyOn(console, "warn").mockImplementation(() => {});
	const embed = nodeEmbed({
		styleFunction: vi.fn(() => undefined),
		baseMapsightConfig: {
			map: {layers: {parks: layer(true), cafes: layer(false)}},
			featureSources: {
				parks: {type: "local"},
				cafes: {type: "local"},
				all: {type: "combined", featureSourceNames: ["parks", "cafes"]},
			},
		},
		createOptions: {
			validateConfig: false,
			uiState: {map: {show: false}, list: {show: false}},
			plugins: [
				[
					"combinedVisibleLayers",
					createCombinedVisibleLayersPlugin({
						combinedFeatureSourceId: "all",
						members: ["parks", "cafes"],
					}),
				],
			],
		},
	});
	const store = embed.store;
	if (!store) {
		throw new Error("Expected a store");
	}
	const sources = () =>
		(store.getState() as {featureSources: Record<string, unknown>})
			.featureSources;
	return {store, sources};
}

afterEach(() => vi.restoreAllMocks());

describe("combined visible layers plugin", () => {
	it("keeps the combined source on the visible member layers", () => {
		const {store, sources} = embedWithCombinedSource();
		expect(sources().all).toMatchObject({featureSourceNames: ["parks"]});

		store.dispatch(setLayerVisibility("map", "cafes", true));

		expect(sources().all).toMatchObject({
			type: "combined",
			featureSourceNames: ["parks", "cafes"],
		});
	});

	it("does not recreate a removed combined source when a layer is toggled", () => {
		const {store, sources} = embedWithCombinedSource();
		store.dispatch(removeFeatureSource("featureSources", "all"));
		expect(sources()).not.toHaveProperty("all");

		store.dispatch(setLayerVisibility("map", "cafes", true));
		store.dispatch(setLayerVisibility("map", "parks", false));

		expect(sources()).not.toHaveProperty("all");
		expect(Object.keys(sources()).sort()).toEqual(["cafes", "parks"]);
	});

	it("synchronises again when the combined source is added back", () => {
		const {store, sources} = embedWithCombinedSource();
		store.dispatch(removeFeatureSource("featureSources", "all"));

		store.dispatch(
			set(["featureSources", "all"], {
				type: "combined",
				featureSourceNames: ["parks", "cafes"],
			}),
		);

		expect(sources().all).toMatchObject({
			type: "combined",
			featureSourceNames: ["parks"],
		});
	});
});
