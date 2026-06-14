import {describe, expect, it} from "vitest";

import {deserializeRange, parsePresetsResponse} from "./platform.js";

describe("platform response parsers", () => {
	it("parses presets with JSON payload date ranges", () => {
		const presets = parsePresetsResponse({
			data: [
				{
					id: 42,
					name: "Rush hour",
					payload: JSON.stringify({
						mainStationId: 150,
						additionalStationRefs: [
							{id: 151, isEnabled: true},
							{id: 152, isEnabled: false},
						],
						additionalDateRanges: [
							{type: "day", date: "2026-06-01"},
							{
								type: "range",
								startDate: "2026-06-03",
								endDate: "2026-06-05",
							},
						],
					}),
				},
			],
		});

		expect(presets).toHaveLength(1);
		expect(presets[0]).toMatchObject({
			id: 42,
			value: 42,
			name: "Rush hour",
			mainStationId: 150,
			additionalStationRefs: [
				{id: 151, isEnabled: true},
				{id: 152, isEnabled: false},
			],
		});
		expect(presets[0]!.additionalDateRanges[0]).toEqual({
			type: "day",
			date: new Date(2026, 5, 1),
		});
		expect(presets[0]!.additionalDateRanges[1]).toEqual({
			type: "range",
			startDate: new Date(2026, 5, 3),
			endDate: new Date(2026, 5, 5),
		});
	});

	it("rejects malformed preset payloads", () => {
		expect(() =>
			parsePresetsResponse({
				data: [{id: 42, name: "Broken", payload: "{}"}],
			}),
		).toThrow();
		expect(() =>
			parsePresetsResponse({
				data: [{id: 42, name: "Broken", payload: "not json"}],
			}),
		).toThrow();
	});

	it("deserializes individual ranges through the same schema", () => {
		expect(deserializeRange({type: "day", date: "2026-06-01"})).toEqual({
			type: "day",
			date: new Date(2026, 5, 1),
		});
	});
});
