import {describe, expect, it} from "vitest";

import {parseTrafficEvent, parseTrafficEventsResponse} from "./utils.js";

describe("traffic events response parsers", () => {
	it("parses traffic events", () => {
		expect(
			parseTrafficEvent({
				id: 7,
				title: "Road works",
				start_date: "2026-06-01",
				end_date: "2026-06-02",
				full_day: false,
				start_time: "08:00",
				end_time: null,
			}),
		).toEqual({
			id: 7,
			title: "Road works",
			start_date: "2026-06-01",
			end_date: "2026-06-02",
			full_day: false,
			start_time: "08:00",
			end_time: null,
		});
	});

	it("parses event responses and defaults missing manualEvents to an empty list", () => {
		expect(
			parseTrafficEventsResponse({
				manualEvents: [
					{
						id: 7,
						title: "Road works",
						start_date: "2026-06-01",
						end_date: "2026-06-02",
						full_day: true,
						start_time: null,
						end_time: null,
					},
				],
			}),
		).toEqual({
			manualEvents: [
				{
					id: 7,
					title: "Road works",
					start_date: "2026-06-01",
					end_date: "2026-06-02",
					full_day: true,
					start_time: null,
					end_time: null,
				},
			],
		});

		expect(parseTrafficEventsResponse({})).toEqual({manualEvents: []});
	});

	it("rejects malformed events", () => {
		expect(() =>
			parseTrafficEventsResponse({
				manualEvents: [
					{
						id: "7",
						title: "Road works",
						start_date: "2026-06-01",
						end_date: "2026-06-02",
						full_day: true,
						start_time: null,
						end_time: null,
					},
				],
			}),
		).toThrow();
	});
});
