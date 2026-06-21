import type {ReactNode} from "react";

import type {
	ValuesRequest as ApiValuesRequest,
	CountAggregatorClient,
	LastValuesRequest,
	StationListResponse,
	StationTypeListResponse,
	TimeSeriesMapResponse,
} from "@mapsight/count-aggregator-api";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {renderHook, waitFor} from "@testing-library/react";
import {beforeEach, describe, expect, it, vi} from "vitest";

import {CountAggregatorProvider} from "../context/count-aggregator-provider.js";
import type {CountAggregatorConfig} from "../types/index.js";
import {
	useAggregatedValues,
	useLastValues,
	useStationTypeCounts,
	useStations,
} from "./hooks.js";

const mocks = vi.hoisted(() => {
	const mockClient = {} as CountAggregatorClient;
	return {
		mockClient,
		createCountAggregatorClient: vi.fn(() => mockClient),
		listStationTypes: vi.fn(),
		listStations: vi.fn(),
		getLastValues: vi.fn(),
		getValues: vi.fn(),
	};
});

vi.mock("@mapsight/count-aggregator-api", async (importActual) => {
	const actual =
		await importActual<typeof import("@mapsight/count-aggregator-api")>();

	return {
		...actual,
		createCountAggregatorClient: mocks.createCountAggregatorClient,
		listStationTypes: mocks.listStationTypes,
		listStations: mocks.listStations,
		getLastValues: mocks.getLastValues,
		getValues: mocks.getValues,
	};
});

const apiBaseUrl = "/mock/msp/public/count-aggregator";
const appId = "bicycleCount";

const config: CountAggregatorConfig = {
	apps: {
		[appId]: {
			id: appId,
			apiBaseUrl,
			stationType: "bicycleCount",
			defaultMetric: "sum",
			defaultResolution: "daily",
		},
	},
	links: {
		calendarUrl: (dateYmd) => `/calendar/${dateYmd}`,
		eventUrl: (dateYmd, eventId) => `/calendar/${dateYmd}/${eventId}`,
	},
};

const stationListResponse: StationListResponse = {
	data: [
		{
			id: 150,
			type: "bicycleCount",
			origin_id: "138969",
			name: "Example Counter A",
			status: null,
			label: "Example Counter A",
			hasData: true,
			lastDataAt: "2026-06-10 22:00:00",
		},
	],
};

const valuesResponse: TimeSeriesMapResponse = {
	"150": {
		id: 150,
		fromDateTime: "2026-06-01 00:00:00",
		toDateTime: "2026-06-02 00:00:00",
		lastDateTime: "2026-06-02 00:00:00",
		resolution: "daily",
		stationId: "138969",
		values: [{datetime: "2026-06-01 00:00:00", value: 12}],
	},
};

const stationTypeListResponse: StationTypeListResponse = {
	data: [
		{
			type: "bicycleCount",
			label: "Bicycle counters",
			station_count: 12,
			category: {id: "traffic", label: "Traffic"},
			defaultMetric: "sum",
			supportedResolutions: ["daily", "hourly"],
			metrics: [
				{
					id: "sum",
					label: "Sum",
					unit: null,
					displayPrecision: 0,
					defaultMetric: "sum",
					aggregation: ["sum"],
				},
			],
		},
		{
			type: "peopleCount",
			label: "People counters",
			station_count: 4,
			category: {id: "traffic", label: "Traffic"},
			defaultMetric: "sum",
			supportedResolutions: ["daily", "hourly"],
			metrics: [
				{
					id: "sum",
					label: "Sum",
					unit: null,
					displayPrecision: 0,
					defaultMetric: "sum",
					aggregation: ["sum"],
				},
			],
		},
	],
};

function createWrapper(): {
	queryClient: QueryClient;
	wrapper: ({children}: {children: ReactNode}) => ReactNode;
} {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {retry: false},
		},
	});

	return {
		queryClient,
		wrapper({children}) {
			return (
				<QueryClientProvider client={queryClient}>
					<CountAggregatorProvider config={config}>
						{children}
					</CountAggregatorProvider>
				</QueryClientProvider>
			);
		},
	};
}

describe("count-aggregator hooks", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.listStations.mockResolvedValue(stationListResponse);
		mocks.listStationTypes.mockResolvedValue(stationTypeListResponse);
		mocks.getLastValues.mockResolvedValue(valuesResponse);
		mocks.getValues.mockResolvedValue(valuesResponse);
	});

	it("useStationTypeCounts maps station type summaries by type", async () => {
		const {queryClient, wrapper} = createWrapper();

		const {result} = renderHook(() => useStationTypeCounts(apiBaseUrl), {
			wrapper,
		});

		await waitFor(() =>
			expect(
				result.current.stationCountsByType?.get("bicycleCount"),
			).toBe(12),
		);

		expect(mocks.listStationTypes).toHaveBeenCalledWith(mocks.mockClient);
		expect(
			queryClient.getQueryData([
				"count-aggregator",
				"station-types",
				apiBaseUrl,
			]),
		).toBe(stationTypeListResponse.data);
	});

	it("useStations loads stations with the typed helper and stores the expected query key", async () => {
		const {queryClient, wrapper} = createWrapper();

		const {result} = renderHook(() => useStations(appId), {wrapper});

		await waitFor(() => expect(result.current?.get(150)).toBeDefined());

		expect(mocks.createCountAggregatorClient).toHaveBeenCalledWith(
			apiBaseUrl,
		);
		expect(mocks.listStations).toHaveBeenCalledWith(
			mocks.mockClient,
			"bicycleCount",
		);
		expect(
			queryClient.getQueryData([
				"count-aggregator",
				appId,
				"stations",
				apiBaseUrl,
				"bicycleCount",
			]),
		).toBe(result.current);
	});

	it("useLastValues loads values with station ids, resolution, and optional params", async () => {
		const {queryClient, wrapper} = createWrapper();

		const request = {
			stationIds: [150],
			resolution: "hourly" as const,
			limit: 3,
			startDate: "2026-06-01",
		};
		const {result} = renderHook(() => useLastValues(appId, request), {
			wrapper,
		});

		await waitFor(() =>
			expect(result.current?.stationsById.get(150)).toBeDefined(),
		);

		expect(mocks.getLastValues).toHaveBeenCalledWith(mocks.mockClient, {
			type: "bicycleCount",
			...request,
			metrics: ["sum"],
		} satisfies LastValuesRequest);
		expect(
			queryClient.getQueryData([
				"count-aggregator",
				appId,
				"last-values",
				apiBaseUrl,
				"bicycleCount",
				{...request, metrics: ["sum"]},
			]),
		).toBe(result.current);
	});

	it("useAggregatedValues respects enabled=false before fetching stepped results", async () => {
		const {wrapper} = createWrapper();
		const request = {
			stationIds: [150],
			startDate: new Date(2026, 5, 1),
			endDate: new Date(2026, 5, 2),
			resolution: "daily" as const,
		};

		const {result, rerender} = renderHook(
			({enabled}: {enabled: boolean}) =>
				useAggregatedValues(appId, request, {enabled}),
			{initialProps: {enabled: false}, wrapper},
		);

		expect(result.current).toBeUndefined();
		expect(mocks.getValues).not.toHaveBeenCalled();

		rerender({enabled: true});

		await waitFor(() =>
			expect(result.current?.stationsById.get(150)).toBeDefined(),
		);
		expect(mocks.getValues).toHaveBeenCalledWith(mocks.mockClient, {
			type: "bicycleCount",
			from: "2026-06-01",
			to: "2026-06-02",
			resolution: "daily",
			stationIds: [150],
			metrics: ["sum"],
		} satisfies ApiValuesRequest);
	});
});
