import {afterEach, describe, expect, it, vi} from "vitest";

import {mapsightConfigSchema} from "../schema";
import {formatZodError, validateMapsightConfig} from "../schema/validate";

describe("mapsightConfigSchema", () => {
	it("parses a valid minimal preset", () => {
		const result = mapsightConfigSchema.safeParse({
			map: {layers: {x: {type: "OSM"}}},
		});
		expect(result.success).toBe(true);
	});

	it("fails when a layer is missing type", () => {
		const result = mapsightConfigSchema.safeParse({
			map: {layers: {x: {options: {}}}},
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(formatZodError(result.error)).toContain("type");
		}
	});

	it("parses feature source config without runtime fields", () => {
		const result = mapsightConfigSchema.safeParse({
			featureSources: {
				pois: {type: "xhr-json", url: "/data/pois.json"},
			},
		});
		expect(result.success).toBe(true);
	});

	it("parses list config fields used by featureList()", () => {
		const result = mapsightConfigSchema.safeParse({
			list: {
				featureSource: "pois",
				visible: false,
				featureSelectionHighlight: "highlight",
				featureSelectionSelect: "select",
			},
		});
		expect(result.success).toBe(true);
	});

	it("allows app slice via catchall", () => {
		const result = mapsightConfigSchema.safeParse({
			app: {view: "mobile"},
		});
		expect(result.success).toBe(true);
	});
});

describe("validateMapsightConfig", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it("returns parsed data on success", () => {
		const config = {map: {layers: {base: {type: "OSM"}}}};
		expect(validateMapsightConfig(config)).toEqual(config);
	});

	it("warns in development on invalid config", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		vi.stubGlobal("process", {
			...process,
			env: {...process.env, NODE_ENV: "development"},
		});

		const invalid = {map: {layers: {x: {options: {}}}}};
		const result = validateMapsightConfig(invalid, {context: "test"});

		expect(warn).toHaveBeenCalledWith(
			"[mapsight] Config validation failed:",
			expect.stringContaining("[test]"),
		);
		expect(result).toBe(invalid);
	});
});
