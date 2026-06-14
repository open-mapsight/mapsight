import {describe, expect, it} from "vitest";

import type {AggregatedValuesData, StationValue} from "../../types/index.js";
import {prepareChartValues} from "./time-series-chart.js";

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
