import {describe, expect, it} from "vitest";

import {
	layerConfigSchema,
	mapConfigSchema,
	vectorFeatureSourceStateSchema,
} from "@/lib/map/schema";

describe("map config schema", () => {
	it("parses a vector feature layer with structured source options", () => {
		const result = layerConfigSchema.safeParse({
			type: "VectorLayer",
			options: {
				visible: true,
				source: {
					type: "VectorFeatureSource",
					options: {
						featureSourceId: "pois",
						clusterFeatures: true,
						clusterFeaturesOptions: {distance: 40},
					},
				},
				selections: {
					mousedown: "select",
					mouseover: "highlight",
				},
			},
		});
		expect(result.success).toBe(true);
	});

	it("parses tile and OSM source layers", () => {
		expect(
			layerConfigSchema.safeParse({
				type: "TileLayer",
				options: {
					source: {
						type: "OsmSource",
						options: {url: "https://tile.osm.org"},
					},
				},
			}).success,
		).toBe(true);

		expect(
			layerConfigSchema.safeParse({
				type: "TileLayer",
				options: {
					source: {
						type: "TileWMSSource",
						options: {url: "/wms", params: {LAYERS: "foo"}},
					},
				},
			}).success,
		).toBe(true);
	});

	it("rejects VectorFeatureSource with wrong type literal", () => {
		const result = vectorFeatureSourceStateSchema.safeParse({
			type: "VectorSource",
			options: {},
		});
		expect(result.success).toBe(false);
	});

	it("parses stadtplan-style map config with cluster options", () => {
		const result = mapConfigSchema.safeParse({
			layers: {
				pois: {
					type: "VectorLayer",
					metaData: {title: "POIs", group: "Points"},
					options: {
						source: {
							type: "VectorFeatureSource",
							options: {
								featureSourceId: "pois",
								keepFeaturesInViewOptions: {
									padding: [20, 20, 20, 20],
								},
								fitFeaturesInViewOptions: {
									padding: [20, 20, 20, 20],
								},
								clusterFeatures: true,
								clusterFeaturesOptions: {distance: 40},
							},
						},
					},
				},
			},
		});
		expect(result.success).toBe(true);
	});
});
