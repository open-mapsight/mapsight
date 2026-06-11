import {beforeEach, describe, expect, it} from "vitest";

import {
	getPictogram,
	hasPictogram,
	listPictogramIdsBySource,
	registerPictograms,
} from "./registry.ts";
import type {PictogramDefinition} from "./types.ts";

const samplePictogram: PictogramDefinition = {
	id: "sample",
	viewBox: "0 0 10 10",
	markup: "<path d='M0 0'/>",
	source: "traffic-style",
};

describe("pictogram registry", () => {
	beforeEach(() => {
		registerPictograms([samplePictogram]);
	});

	it("registers and resolves pictograms by id", () => {
		expect(hasPictogram("sample")).toBe(true);
		expect(getPictogram("sample").source).toBe("traffic-style");
	});

	it("lists ids by source", () => {
		registerPictograms([
			{
				id: "fa-test",
				viewBox: "0 0 10 10",
				markup: "<path d='M0 0'/>",
				source: "fontawesome",
			},
		]);

		expect(listPictogramIdsBySource("traffic-style")).toContain("sample");
		expect(listPictogramIdsBySource("fontawesome")).toContain("fa-test");
	});
});
