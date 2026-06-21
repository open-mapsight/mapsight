import {createElement} from "react";

import {render, screen} from "@testing-library/react";
import {describe, expect, it} from "vitest";

import {CountAggregatorProvider} from "../../context/count-aggregator-provider.js";
import type {
	AggregatedValuesData,
	CountAggregatorConfig,
	StationValue,
} from "../../types/index.js";
import {TimeSeriesChart, prepareChartValues} from "./time-series-chart.js";

function createValues(count: number): StationValue[] {
	return Array.from({length: count}, (_, index) => ({
		date: new Date(2024, 0, 1 + index),
		value: index,
	}));
}

const config: CountAggregatorConfig = {
	apps: {
		bicycleCount: {
			id: "bicycleCount",
			apiBaseUrl: "/mock",
			stationType: "bicycleCount",
			defaultMetric: "sum",
			displayPrecision: 0,
			valueUnit: null,
		},
		waterLevelSurface: {
			id: "waterLevelSurface",
			apiBaseUrl: "/mock",
			stationType: "waterLevelSurface",
			defaultMetric: "mean",
			displayPrecision: 2,
			valueUnit: "mNN",
		},
	},
	links: {
		calendarUrl: (dateYmd) => `/calendar/${dateYmd}`,
		eventUrl: (dateYmd, eventId) => `/calendar/${dateYmd}/${eventId}`,
	},
};

describe("prepareChartValues", () => {
	it("limits values to the data cap for one station", () => {
		const data: AggregatedValuesData = {
			stationsById: new Map([
				[
					1,
					{
						stationId: 1,
						values: createValues(6000),
						valuesByMetric: {sum: createValues(6000)},
					},
				],
			]),
		};

		const {tooMuchData, chartSeries} = prepareChartValues(
			[1],
			data,
			["sum"],
			"sum",
		);

		expect(tooMuchData).toBe(true);
		expect(chartSeries?.[0]?.values).toHaveLength(5000);
	});

	it("splits the data cap across selected stations", () => {
		const data: AggregatedValuesData = {
			stationsById: new Map([
				[
					1,
					{
						stationId: 1,
						values: createValues(3000),
						valuesByMetric: {sum: createValues(3000)},
					},
				],
				[
					2,
					{
						stationId: 2,
						values: createValues(3000),
						valuesByMetric: {sum: createValues(3000)},
					},
				],
			]),
		};

		const {tooMuchData, chartSeries} = prepareChartValues(
			[1, 2],
			data,
			["sum"],
			"sum",
		);

		expect(tooMuchData).toBe(true);
		expect(
			chartSeries?.find((entry) => entry.stationId === 1)?.values,
		).toHaveLength(2500);
		expect(
			chartSeries?.find((entry) => entry.stationId === 2)?.values,
		).toHaveLength(2500);
	});

	it("returns no values when data is absent", () => {
		const {tooMuchData, chartSeries} = prepareChartValues(
			[1],
			undefined,
			["sum"],
			"sum",
		);

		expect(tooMuchData).toBe(false);
		expect(chartSeries).toBeUndefined();
	});
});

describe("TimeSeriesChart", () => {
	it("shows an empty state after data loaded without measurements", () => {
		render(
			<CountAggregatorProvider config={config}>
				{createElement(TimeSeriesChart, {
					appId: "bicycleCount",
					type: "column",
					selectedStationIds: [1],
					selectedMetrics: ["sum"],
					chartSeries: [
						{
							key: "station_1_sum",
							stationId: 1,
							metric: "sum",
							values: [],
						},
					],
					resolution: "daily",
					startDate: new Date(2026, 5, 1),
					endDate: new Date(2026, 5, 2),
					stationsById: new Map(),
					emptyMessage:
						"Für die aktuelle Auswahl sind keine Messwerte verfügbar.",
				})}
			</CountAggregatorProvider>,
		);

		expect(screen.getByRole("status")).toBeTruthy();
		expect(screen.getByText(/keine messwerte verfügbar/i)).toBeTruthy();
	});
});
