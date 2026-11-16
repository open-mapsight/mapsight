import {describe, expect, it} from "vitest";

import type {BucketMetric, ChartSeries, DataResolution} from "../types";
import {mergeSeriesData} from "./chart-data.js";

function series(
	key: string,
	dates: Date[],
	metric: BucketMetric = "mean",
): ChartSeries {
	return {
		key,
		stationId: 1,
		metric,
		values: dates.map((date, i) => ({date, value: i * 10})),
	};
}

describe("mergeSeriesData", () => {
	it.each<[DataResolution, number]>([
		["5min", 5],
		["15min", 15],
		["hourly", 60],
	])(
		"inserts missing %s buckets when all stations have a gap",
		(resolution, minutes) => {
			const start = new Date(2026, 0, 1).getTime();
			const dates = [0, 3].map(
				(i) => new Date(start + i * minutes * 60_000),
			);
			const rows = mergeSeriesData(
				[series("a", dates), series("b", dates)],
				resolution,
			);
			expect(rows).toEqual([
				{date: start, a: 0, b: 0},
				{date: start + minutes * 60_000, a: null, b: null},
				{date: start + 2 * minutes * 60_000, a: null, b: null},
				{date: dates[1]!.getTime(), a: 10, b: 10},
			]);
		},
	);

	it("keeps missing stations and metrics null while retaining real zeros", () => {
		const dates = [1, 2, 3].map((day) => new Date(2026, 0, day));
		const input = [
			series("min", [dates[0]!, dates[2]!], "min"),
			series("max", dates, "max"),
		];
		const original = structuredClone(input);
		const rows = mergeSeriesData(input, "daily");
		expect(rows[1]).toEqual({
			date: dates[1]!.getTime(),
			min: null,
			max: 10,
		});
		expect(rows[0]?.min).toBe(0);
		expect(input).toEqual(original);
		expect(
			rows.flatMap((row) => (row.min === null ? [] : [row.min])),
		).toEqual([0, 10]);
	});

	it.each<[DataResolution, Date[]]>([
		[
			"daily",
			[
				new Date(2026, 2, 28),
				new Date(2026, 2, 29),
				new Date(2026, 2, 30),
			],
		],
		[
			"weekly",
			[
				new Date(2026, 9, 19),
				new Date(2026, 9, 26),
				new Date(2026, 10, 2),
			],
		],
		[
			"monthly",
			[
				new Date(2024, 0, 31),
				new Date(2024, 1, 29),
				new Date(2024, 2, 31),
			],
		],
		[
			"yearly",
			[
				new Date(2024, 1, 29),
				new Date(2025, 1, 28),
				new Date(2026, 1, 28),
			],
		],
	])("uses calendar steps for %s buckets", (resolution, dates) => {
		const rows = mergeSeriesData(
			[series("a", [dates[0]!, dates[2]!])],
			resolution,
		);
		expect(rows.map((row) => row.date)).toEqual(
			dates.map((date) => date.getTime()),
		);
		expect(rows[1]?.a).toBeNull();
		expect(mergeSeriesData([series("a", dates)], resolution)).toHaveLength(
			3,
		);
	});

	it("sorts unsorted input and does not synthesize values for empty series", () => {
		const dates = [3, 1, 2].map((day) => new Date(2026, 0, day));
		const rows = mergeSeriesData(
			[series("a", dates), series("b", [])],
			"daily",
		);
		expect(rows.map((row) => row.a)).toEqual([10, 20, 0]);
		expect(rows.map((row) => row.b)).toEqual([null, null, null]);
		expect(mergeSeriesData([], "daily")).toEqual([]);
	});

	it("bounds expansion for long outages and preserves subsequent break markers", () => {
		const dates = [
			new Date(2000, 0, 1),
			new Date(2020, 0, 1),
			new Date(2026, 0, 1),
		];
		const rows = mergeSeriesData([series("a", dates)], "5min");
		expect(rows.length).toBeLessThanOrEqual(5004);
		const second = rows.findIndex(
			(row) => row.date === dates[1]!.getTime(),
		);
		expect(rows[second - 1]?.a).toBeNull();
		expect(rows[second + 1]?.a).toBeNull();
		expect(rows.at(-1)?.a).toBe(20);
	});
});
