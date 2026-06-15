import {createElement} from "react";

import {render, screen} from "@testing-library/react";
import {describe, expect, it} from "vitest";

import type {AggregatedValuesData, StationValue} from "../../types/index.js";
import {TimeSeriesChart, prepareChartValues} from "./time-series-chart.js";

function createValues(count: number): StationValue[] {
	return Array.from({length: count}, (_, index) => ({
		date: new Date(2024, 0, 1 + index),
		value: index,
	}));
}

describe("prepareChartValues", () => {
	it("limits values to the data cap for one station", () => {
		const data: AggregatedValuesData = {
			stationsById: new Map([
				[1, {stationId: 1, values: createValues(6000)}],
			]),
		};

		const {tooMuchData, valuesByStationId} = prepareChartValues([1], data);

		expect(tooMuchData).toBe(true);
		expect(valuesByStationId?.get(1)).toHaveLength(5000);
	});

	it("splits the data cap across selected stations", () => {
		const data: AggregatedValuesData = {
			stationsById: new Map([
				[1, {stationId: 1, values: createValues(3000)}],
				[2, {stationId: 2, values: createValues(3000)}],
			]),
		};

		const {tooMuchData, valuesByStationId} = prepareChartValues(
			[1, 2],
			data,
		);

		expect(tooMuchData).toBe(true);
		expect(valuesByStationId?.get(1)).toHaveLength(2500);
		expect(valuesByStationId?.get(2)).toHaveLength(2500);
	});

	it("returns no values when data is absent", () => {
		const {tooMuchData, valuesByStationId} = prepareChartValues(
			[1],
			undefined,
		);

		expect(tooMuchData).toBe(false);
		expect(valuesByStationId).toBeUndefined();
	});
});

describe("TimeSeriesChart", () => {
	it("shows an empty state after data loaded without measurements", () => {
		render(
			createElement(TimeSeriesChart, {
				type: "column",
				selectedStationIds: [1],
				valuesByStationId: new Map([[1, []]]),
				resolution: "daily",
				startDate: new Date(2026, 5, 1),
				endDate: new Date(2026, 5, 2),
				stationsById: new Map(),
				emptyMessage:
					"Für die aktuelle Auswahl sind keine Messwerte verfügbar.",
			}),
		);

		expect(screen.getByRole("status")).toBeTruthy();
		expect(screen.getByText(/keine messwerte verfügbar/i)).toBeTruthy();
	});
});
