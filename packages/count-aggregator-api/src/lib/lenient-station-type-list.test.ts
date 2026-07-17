import {afterEach, describe, expect, it, vi} from "vitest";
import {z} from "zod";

import {createLenientStationTypeListResponseSchema} from "./lenient-station-type-list.js";

const summarySchema = z
	.object({
		type: z.enum(["bicycleSensorTotal", "peopleCount"]),
		label: z.string(),
	})
	.strict();

const listSchema = createLenientStationTypeListResponseSchema(summarySchema);

describe("createLenientStationTypeListResponseSchema", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("keeps known station types", () => {
		const result = listSchema.parse({
			data: [
				{type: "bicycleSensorTotal", label: "Bicycle"},
				{type: "peopleCount", label: "People"},
			],
		});

		expect(result.data).toEqual([
			{type: "bicycleSensorTotal", label: "Bicycle"},
			{type: "peopleCount", label: "People"},
		]);
	});

	it("drops unknown types and logs a warning", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

		const result = listSchema.parse({
			data: [
				{type: "bicycleSensorTotal", label: "Bicycle"},
				{type: "brandNewSensorType", label: "Brand new"},
				{type: "peopleCount", label: "People"},
			],
		});

		expect(result.data).toEqual([
			{type: "bicycleSensorTotal", label: "Bicycle"},
			{type: "peopleCount", label: "People"},
		]);
		expect(warn).toHaveBeenCalledTimes(1);
		expect(String(warn.mock.calls[0]?.[0])).toContain(
			'Ignoring unknown or invalid station type "brandNewSensorType"',
		);
	});
});
