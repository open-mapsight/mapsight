import {describe, expect, it} from "vitest";

import type {FeatureSourceState} from "@mapsight/core/lib/feature-sources/types";
import type {LayerState} from "@mapsight/core/lib/map/types";

import {
	collectCitationIconIds,
	iconIdFromLayerStyle,
	iconIdsFromFeatures,
	listFeatureSourceIdsForCitations,
} from "./collect-icon-ids";

describe("iconIdFromLayerStyle", () => {
	it("reads mapsightIconId from a layer style env object", () => {
		expect(
			iconIdFromLayerStyle({
				style: "features",
				mapsightIconId: "fa-bolt/#f59e0b",
			}),
		).toBe("fa-bolt/#f59e0b");
	});

	it("ignores a style name string", () => {
		expect(iconIdFromLayerStyle("features")).toBeUndefined();
	});
});

describe("iconIdsFromFeatures", () => {
	it("collects mapsightIconId from loaded features", () => {
		expect(
			iconIdsFromFeatures([
				{properties: {mapsightIconId: "fa-car-bus"}},
				{properties: {title: "no icon"}},
				{properties: {mapsightIconId: "museum"}},
			]),
		).toEqual(["fa-car-bus", "museum"]);
	});
});

describe("listFeatureSourceIdsForCitations", () => {
	it("uses combined-list members instead of listCombined", () => {
		const featureSources: Record<string, FeatureSourceState> = {
			listCombined: {
				type: "combined",
				featureSourceNames: ["museen", "theater"],
				data: null,
				lastUpdate: null,
				lastActionType: null,
			},
			museen: {
				type: "xhr-json",
				data: null,
				lastUpdate: null,
				lastActionType: null,
			},
		};

		expect(
			listFeatureSourceIdsForCitations("listCombined", featureSources),
		).toEqual(["museen", "theater"]);
	});

	it("keeps a single list feature source", () => {
		expect(
			listFeatureSourceIdsForCitations("schools", {
				schools: {
					type: "xhr-json",
					data: null,
					lastUpdate: null,
					lastActionType: null,
				},
			}),
		).toEqual(["schools"]);
	});
});

describe("collectCitationIconIds", () => {
	it("unions host glyphs, visible layer env, feature-source default, and loaded list features", () => {
		const layers: Record<string, LayerState> = {
			hidden: {
				options: {
					visible: false,
					style: {mapsightIconId: "fa-wifi"},
					source: {
						type: "VectorFeatureSource",
						options: {featureSourceId: "wifi"},
					},
				},
			},
			schools: {
				options: {
					visible: true,
					style: {mapsightIconId: "fa-school"},
					source: {
						type: "VectorFeatureSource",
						options: {featureSourceId: "schools"},
					},
				},
			},
		};

		expect(
			collectCitationIconIds({
				hostPictogramIds: ["fa-bolt", "marker"],
				visibleLayerIds: ["schools"],
				layers,
				listFeatureSourceId: "schools",
				featureSources: {
					schools: {
						type: "xhr-json",
						data: {
							features: [
								{properties: {mapsightIconId: "fa-chalkboard"}},
							],
						},
						lastUpdate: null,
						lastActionType: null,
					},
				},
				searchResultFeatures: [
					{properties: {mapsightIconId: "fa-location-dot"}},
				],
			}),
		).toEqual([
			"fa-bolt",
			"marker",
			"fa-school",
			"fa-chalkboard",
			"fa-location-dot",
		]);
	});

	it("skips searchResult icons when search has no features", () => {
		expect(
			collectCitationIconIds({
				hostPictogramIds: [],
				visibleLayerIds: [],
				layers: {},
				listFeatureSourceId: undefined,
				featureSources: {},
				searchResultFeatures: [],
			}),
		).toEqual([]);
	});

	it("collects list-feature icons when the map is hidden", () => {
		expect(
			collectCitationIconIds({
				hostPictogramIds: [],
				visibleLayerIds: [],
				layers: {
					schools: {
						options: {
							visible: false,
							style: {mapsightIconId: "fa-school"},
							source: {
								type: "VectorFeatureSource",
								options: {featureSourceId: "schools"},
							},
						},
					},
				},
				listFeatureSourceId: "schools",
				featureSources: {
					schools: {
						type: "xhr-json",
						data: {
							features: [
								{properties: {mapsightIconId: "fa-chalkboard"}},
							],
						},
						lastUpdate: null,
						lastActionType: null,
					},
				},
			}),
		).toEqual(["fa-school", "fa-chalkboard"]);
	});
});
