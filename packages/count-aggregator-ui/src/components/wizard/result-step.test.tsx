import type {ReactNode} from "react";

import {render, screen} from "@testing-library/react";
import {describe, expect, it, vi} from "vitest";

import {CountAggregatorProvider} from "../../context/count-aggregator-provider.js";
import type {
	AggregatedValuesData,
	CountAggregatorConfig,
	Station,
	StationValue,
} from "../../types/index.js";
import {ResultStep} from "./result-step.js";

vi.mock("../charts/time-series-chart.js", async (importActual) => {
	const actual =
		await importActual<typeof import("../charts/time-series-chart.js")>();

	return {
		...actual,
		TimeSeriesChart() {
			return <div data-testid="time-series-chart" />;
		},
	};
});

const apiBaseUrl = "/mock/msp/public/count-aggregator";
const appId = "bicycleCount";
const startDate = new Date(2026, 5, 1);
const endDate = new Date(2026, 5, 2);

const config: CountAggregatorConfig = {
	apps: {
		[appId]: {
			id: appId,
			apiBaseUrl,
			stationType: "bicycleCount",
			defaultResolution: "daily",
		},
	},
	links: {
		calendarUrl: (dateYmd) => `/calendar/${dateYmd}`,
		eventUrl: (dateYmd, eventId) => `/calendar/${dateYmd}/${eventId}`,
	},
};

const stationsById = new Map<number, Station>([
	[
		150,
		{
			id: 150,
			typeName: "bicycleCount",
			status: null,
			label: "Pockelstraße (Anzahl)",
			originId: "138969",
		},
	],
]);

function createData(values: StationValue[]): AggregatedValuesData {
	return {
		stationsById: new Map([[150, {stationId: 150, values}]]),
	};
}

function renderResultStep(
	props: Partial<Parameters<typeof ResultStep>[0]> = {},
) {
	const defaultProps: Parameters<typeof ResultStep>[0] = {
		appId,
		selectedStationIds: [150],
		startDate,
		endDate,
		data: createData([{date: startDate, value: 12}]),
		stationsById,
		resolution: "daily",
		showExport: true,
	};

	return render(
		<CountAggregatorProvider config={config}>
			<ResultStep {...defaultProps} {...props} />
		</CountAggregatorProvider>,
	);
}

describe("ResultStep", () => {
	it("shows validation messages and disables CSV when the selection is invalid", () => {
		renderResultStep({
			selectedStationIds: [],
			startDate: endDate,
			endDate: startDate,
		});

		expect(screen.getByText(/Keine Messstellen ausgewählt/)).toBeTruthy();
		expect(
			screen.getByText(/Das Enddatum liegt vor dem Startdatum/),
		).toBeTruthy();
		expect(
			screen.getByText(
				"CSV-Export ist erst verfügbar, wenn die Auswahl gültig ist.",
			),
		).toBeTruthy();
		expect(screen.queryByRole("link", {name: /csv/i})).toBeNull();
	});

	it("builds a CSV href when the selection is valid", () => {
		renderResultStep();

		const link = screen.getByRole("link", {
			name: "Als CSV-Datei herunterladen",
		});

		expect(link.getAttribute("href")).toBe(
			"/mock/msp/public/count-aggregator/bicycleCount/values/2026-06-01/2026-06-02/daily?stationIds=150&format=csv",
		);
		expect(screen.getByTestId("time-series-chart")).toBeTruthy();
	});

	it("shows truncation copy with export guidance when chart data is capped", () => {
		const values = Array.from({length: 5001}, (_, index) => ({
			date: new Date(2026, 5, 1 + index),
			value: index,
		}));

		renderResultStep({data: createData(values), showExport: true});

		expect(
			screen.getByText(/Die Diagrammdarstellung wurde auf 5\.000/),
		).toBeTruthy();
		expect(
			screen.getByText(/Bitte nutzen Sie den Download-Link/),
		).toBeTruthy();
	});
});
