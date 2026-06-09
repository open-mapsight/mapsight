import {afterEach, describe, expect, it, vi} from "vitest";
import {z} from "zod";

import {featureSourcesConfigSchema} from "@/lib/feature-sources/schema";
import {listConfigSchema} from "@/lib/list/schema";
import {layerConfigSchema} from "@/lib/map/schema";
import {
	createMapsightConfigSchema,
	formatZodError,
	validateConfig,
} from "@/schema";

const exampleConfigSchema = createMapsightConfigSchema({
	map: z.object({layers: z.record(z.string(), layerConfigSchema)}).partial(),
	list: listConfigSchema,
	featureSources: featureSourcesConfigSchema,
});

describe("createMapsightConfigSchema", () => {
	it("parses a valid minimal preset", () => {
		const result = exampleConfigSchema.safeParse({
			map: {layers: {x: {type: "OSM"}}},
		});
		expect(result.success).toBe(true);
	});

	it("fails when a layer is missing type", () => {
		const result = exampleConfigSchema.safeParse({
			map: {layers: {x: {options: {}}}},
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(formatZodError(result.error)).toContain("type");
		}
	});

	it("parses feature source config without runtime fields", () => {
		const result = exampleConfigSchema.safeParse({
			featureSources: {
				pois: {type: "xhr-json", url: "/data/pois.json"},
			},
		});
		expect(result.success).toBe(true);
	});

	it("parses list config fields used by featureList()", () => {
		const result = exampleConfigSchema.safeParse({
			list: {
				featureSource: "pois",
				visible: false,
				featureSelectionHighlight: "highlight",
				featureSelectionSelect: "select",
			},
		});
		expect(result.success).toBe(true);
	});

	it("allows unknown top-level slices via catchall", () => {
		const result = exampleConfigSchema.safeParse({
			map2: {layers: {x: {type: "OSM"}}},
			app: {view: "mobile"},
		});
		expect(result.success).toBe(true);
	});
});

describe("validateConfig", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it("returns parsed data on success", () => {
		const config = {map: {layers: {base: {type: "OSM"}}}};
		expect(validateConfig(exampleConfigSchema, config)).toEqual(config);
	});

	it("warns in development on invalid config", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		vi.stubGlobal("process", {
			...process,
			env: {...process.env, NODE_ENV: "development"},
		});

		const invalid = {map: {layers: {x: {options: {}}}}};
		const result = validateConfig(exampleConfigSchema, invalid, {
			context: "test",
		});

		expect(warn).toHaveBeenCalledWith(
			"[mapsight] Config validation failed:",
			expect.stringContaining("[test]"),
		);
		expect(result).toBe(invalid);
	});

	it("throws in production when strict is true", () => {
		vi.stubGlobal("process", {
			...process,
			env: {...process.env, NODE_ENV: "production"},
		});

		expect(() =>
			validateConfig(
				exampleConfigSchema,
				{map: {layers: {x: {options: {}}}}},
				{strict: true},
			),
		).toThrow(/type/);
	});

	it("passes through invalid config silently in production", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		vi.stubGlobal("process", {
			...process,
			env: {...process.env, NODE_ENV: "production"},
		});

		const invalid = {map: {layers: {x: {options: {}}}}};
		const result = validateConfig(exampleConfigSchema, invalid);

		expect(warn).not.toHaveBeenCalled();
		expect(result).toBe(invalid);
	});
});
