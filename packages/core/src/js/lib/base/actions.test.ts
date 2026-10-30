import {describe, expect, it} from "vitest";

import {mergeConfig, mergeConfigAll} from "@/lib/base/actions";
import {ACTION_MERGE_CONFIG} from "@/lib/base/reducer";

describe("config merge actions", () => {
	it("uses the same non-empty path contract as merge", () => {
		expect(() => mergeConfig([], {})).toThrow("required path is missing");
		expect(() => mergeConfig(null, {})).toThrow("required path is missing");
		expect(
			mergeConfig(["featureSources", "charging"], {filters: []}),
		).toEqual({
			type: ACTION_MERGE_CONFIG,
			meta: {path: ["featureSources", "charging"]},
			value: {filters: []},
		});
	});

	it("batches top-level and nested updates like mergeAll", () => {
		expect(mergeConfigAll({map: {layers: {}}}).payload).toEqual([
			mergeConfig(["map"], {layers: {}}),
		]);
		expect(
			mergeConfigAll(["featureSources"], {charging: {filters: []}})
				.payload,
		).toEqual([mergeConfig(["featureSources", "charging"], {filters: []})]);
	});
});
