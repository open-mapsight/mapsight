import {type ReactElement, cloneElement, createElement} from "react";

import {cleanup, fireEvent, render, screen} from "@testing-library/react";
import type * as Recharts from "recharts";
import {afterEach, describe, expect, it, vi} from "vitest";

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
		bicycleSensorTotal: {
			id: "bicycleSensorTotal",
			apiBaseUrl: "/mock",
			stationType: "bicycleSensorTotal",
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
					appId: "bicycleSensorTotal",
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

// Give Recharts dimensions in jsdom; keep its chart, axes and tooltip rendering real.
vi.mock("recharts", async (importOriginal) => {
	const recharts = await importOriginal<typeof Recharts>();
	return {
		...recharts,
		ResponsiveContainer: ({
			children,
		}: {
			children: ReactElement<{width: number; height: number}>;
		}) => cloneElement(children, {width: 640, height: 320}),
	};
});

afterEach(cleanup);

function renderComparison(
	options: {
		compact?: boolean;
		single?: boolean;
		originIds?: string[];
		type?: "line" | "area" | "column";
	} = {},
) {
	const dates = [0, 1, 4, 5].map((hour) => new Date(2026, 0, 1, hour));
	const ids = options.single ? [1] : [1, 2];
	const stationMap = new Map(
		ids.map((id) => [
			id,
			{
				id,
				label: `Station ${id} with a long label`,
				originId: options.originIds?.[id - 1] ?? `sensor-${id}`,
				typeName: "Level",
				status: null,
			},
		]),
	);
	const comparisonConfig: CountAggregatorConfig = {
		...config,
		locale: "en",
		apps: {
			...config.apps,
			waterLevelSurface: {
				...config.apps.waterLevelSurface!,
				...(options.compact
					? {comparisonTooltip: "compact" as const}
					: {}),
			},
		},
	};
	return render(
		<CountAggregatorProvider config={comparisonConfig}>
			<TimeSeriesChart
				appId="waterLevelSurface"
				type={options.type ?? "line"}
				selectedStationIds={ids}
				selectedMetrics={["mean"]}
				chartSeries={ids.map((id) => ({
					key: `station_${id}_mean`,
					stationId: id,
					metric: "mean",
					values: dates.map((date, i) => ({date, value: i})),
				}))}
				resolution="hourly"
				startDate={dates[0]!}
				endDate={new Date(2026, 0, 8)}
				stationsById={stationMap}
			/>
		</CountAggregatorProvider>,
	);
}

describe("comparison chart rendering", () => {
	it.each([false, true])(
		"uses the configured tooltip labels (compact: %s)",
		async (compact) => {
			renderComparison({compact});
			fireEvent.keyDown(screen.getByRole("application"), {
				key: "ArrowRight",
			});
			expect(
				await screen.findByText(
					compact
						? "sensor-1 · Average"
						: "Station 1 with a long label",
				),
			).toBeTruthy();
			expect(
				screen.getByText(
					compact
						? "sensor-2 · Average"
						: "Station 2 with a long label",
				),
			).toBeTruthy();
		},
	);

	it("keeps full labels for a single series even when compact mode is configured", async () => {
		renderComparison({compact: true, single: true});
		fireEvent.keyDown(screen.getByRole("application"), {key: "ArrowRight"});
		expect(
			await screen.findByText("Station 1 with a long label"),
		).toBeTruthy();
	});

	it.each([
		["shared", "shared"],
		["#2", "#1"],
		["a".repeat(30), "b".repeat(30)],
	])(
		"falls back to station ids when origin ids are ambiguous or long",
		async (...originIds) => {
			renderComparison({compact: true, originIds});
			fireEvent.keyDown(screen.getByRole("application"), {
				key: "ArrowRight",
			});
			expect(await screen.findByText("#1 · Average")).toBeTruthy();
			expect(screen.getByText("#2 · Average")).toBeTruthy();
		},
	);

	it.each(["line", "area"] as const)(
		"breaks %s paths at gaps and includes dates on hourly ticks",
		(type) => {
			const {container} = renderComparison({type});
			const paths = container.querySelectorAll(`.recharts-${type}-curve`);
			expect(paths).toHaveLength(2);
			for (const path of paths)
				expect(path.getAttribute("d")?.match(/M/g)).toHaveLength(2);
			const ticks = container.querySelectorAll(
				".recharts-xAxis-tick-labels .recharts-text",
			);
			expect(ticks.length).toBeGreaterThan(0);
			expect(ticks[0]?.textContent).toMatch(/Jan|01/);
		},
	);
});
