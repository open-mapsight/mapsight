import {describe, expect, it} from "vitest";
import type {z} from "zod";

import {featureSourcesConfigSchema} from "@/lib/feature-sources/schema";
import {layerConfigSchema, mapConfigSchema} from "@/lib/map/schema";
import {createMapsightConfigSchema, formatZodError} from "@/schema";

const configSchema = createMapsightConfigSchema({
	map: mapConfigSchema,
	featureSources: featureSourcesConfigSchema,
});

const layer = (options: unknown, type = "VectorLayer") => ({
	map: {layers: {base: {type, options}}},
});

function format(schema: z.ZodType, input: unknown, context?: string): string {
	const result = schema.safeParse(input);
	if (result.success) {
		throw new Error("expected validation to fail");
	}
	return formatZodError(result.error, context);
}

describe("validation outcome", () => {
	// Pins pass/fail only: improving messages must never change which configs
	// are accepted.
	const cases: Array<[string, unknown, boolean]> = [
		["empty config", {}, true],
		["minimal layer", {map: {layers: {a: {type: "OSM"}}}}, true],
		["layer without type", {map: {layers: {a: {options: {}}}}}, false],
		[
			"vector feature source description",
			layer({source: {type: "VectorFeatureSource", options: {}}}),
			true,
		],
		[
			"vector feature source with wrong option type",
			layer({
				source: {
					type: "VectorFeatureSource",
					options: {clusterFeatures: 1},
				},
			}),
			true,
		],
		[
			"unknown source type via fallback",
			layer({source: {type: "Custom", options: {a: [1, "b", null]}}}),
			true,
		],
		[
			"source description without type",
			layer({source: {options: {}}}),
			false,
		],
		["string source", layer({source: "openmaptiles"}), false],
		[
			"string source on MapboxVectorLayer",
			layer({source: "openmaptiles"}, "MapboxVectorLayer"),
			false,
		],
		[
			"sourceId on MapboxVectorLayer",
			layer({sourceId: "openmaptiles"}, "MapboxVectorLayer"),
			true,
		],
		["wrong visible type", layer({visible: "yes"}), false],
		[
			"non-serializable source option",
			layer({source: {type: "Custom", options: {fn: () => 1}}}),
			false,
		],
		[
			"feature source",
			{featureSources: {pois: {type: "xhr-json", url: "/pois.json"}}},
			true,
		],
		[
			"feature source with unknown key",
			{featureSources: {pois: {type: "xhr-json", urll: "/pois.json"}}},
			false,
		],
		[
			"feature source with unknown type",
			{featureSources: {pois: {type: "csv"}}},
			false,
		],
		// Values that are not layer objects must fail, not throw.
		["null layer entry", {map: {layers: {base: null}}}, false],
		["string layer entry", {map: {layers: {base: "osm"}}}, false],
		[
			"MapboxVectorLayer with non-object options",
			{map: {layers: {base: {type: "MapboxVectorLayer", options: "x"}}}},
			false,
		],
	];

	it.each(cases)("%s", (_name, input, expected) => {
		expect(configSchema.safeParse(input).success).toBe(expected);
	});
});

describe("formatZodError", () => {
	it("keeps the context prefix and path: message shape", () => {
		expect(format(configSchema, layer({visible: "yes"}), "preset")).toBe(
			"[preset] map.layers.base.options.visible: Invalid input: expected boolean, received string",
		);
	});

	it("joins multiple issues with a semicolon", () => {
		const message = format(configSchema, {
			map: {layers: {a: {options: {visible: "yes"}}}},
		});
		expect(message).toBe(
			"map.layers.a.type: Invalid input: expected string, received undefined; map.layers.a.options.visible: Invalid input: expected boolean, received string",
		);
	});

	it("labels root issues", () => {
		expect(format(configSchema, "nope")).toBe(
			"(root): Invalid input: expected object, received string",
		);
	});

	it("explains a string source on a MapboxVectorLayer", () => {
		const message = format(
			configSchema,
			layer({source: "openmaptiles"}, "MapboxVectorLayer"),
		);
		expect(message).toBe(
			'map.layers.base.options.source: "options.source" is reserved for a source description ({type, options}). Name the style source of a MapboxVectorLayer with "options.sourceId" instead.',
		);
		expect(message).not.toContain("Invalid input");
	});

	it("keeps the hint when validating a layer on its own", () => {
		const message = format(layerConfigSchema, {
			type: "MapboxVectorLayer",
			options: {source: "openmaptiles"},
		});
		expect(message).toContain("options.sourceId");
	});

	it("reports the expected type for a string source on other layers", () => {
		expect(format(configSchema, layer({source: "openmaptiles"}))).toBe(
			"map.layers.base.options.source: Invalid input: expected object, received string",
		);
	});

	it("reports the missing type of a source description", () => {
		expect(format(configSchema, layer({source: {options: {}}}))).toBe(
			"map.layers.base.options.source.type: Invalid input: expected string, received undefined",
		);
	});

	it("reports an unknown key on a feature source", () => {
		expect(
			format(configSchema, {
				featureSources: {pois: {type: "xhr-json", urll: "/pois.json"}},
			}),
		).toBe('featureSources.pois: Unrecognized key: "urll"');
	});

	it("reports an invalid feature source type with the allowed values", () => {
		const message = format(configSchema, {
			featureSources: {pois: {type: "csv"}},
		});
		expect(message).toMatch(/^featureSources\.pois\.type: /);
		expect(message).toContain("xhr-json");
	});

	it("descends into nested unions inside source options", () => {
		expect(
			format(
				configSchema,
				layer({source: {type: "Custom", options: {fn: () => 1}}}),
			),
		).toBe(
			"map.layers.base.options.source.options.fn: Invalid input: expected string | boolean | number | null | undefined | array | record, received function",
		);
	});

	it("prefers the branch whose type literal matched", () => {
		const message = format(
			configSchema,
			layer({source: {type: "VectorFeatureSource", options: "x"}}),
		);
		expect(message).toMatch(
			/^map\.layers\.base\.options\.source\.options: Invalid input: expected /,
		);
		expect(message).not.toContain('expected "OsmSource"');
	});
});
