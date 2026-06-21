import {useMemo} from "react";

import {
	createCountAggregatorClient,
	getLastValues,
	getValues,
	listStationTypes,
	listStations,
} from "@mapsight/count-aggregator-api";
import type {BucketMetric, Resolution} from "@mapsight/count-aggregator-api";
import type {UseQueryResult} from "@tanstack/react-query";
import {useQuery} from "@tanstack/react-query";

import {parsePresetsResponse} from "../config/platform.js";
import {useAppConfig} from "../context/count-aggregator-provider.js";
import {normalizeSelectedMetrics} from "../lib/bucket-metrics.js";
import {dateToYmd} from "../lib/dates.js";
import {parseTrafficEventsResponse} from "../lib/utils.js";
import type {
	AggregatedValuesData,
	PresetData,
	Station,
	TrafficEventsData,
	ValuesRequest,
} from "../types";
import {mapStationList, mapTimeSeriesMap} from "./mappers.js";

const STALE_TIME_MS = 5 * 60 * 1000;

export function useStationTypesQuery(apiBaseUrl: string) {
	return useQuery({
		queryKey: ["count-aggregator", "station-types", apiBaseUrl],
		queryFn: async () => {
			const client = createCountAggregatorClient(apiBaseUrl);
			const response = await listStationTypes(client);
			return response.data;
		},
		staleTime: STALE_TIME_MS,
	});
}

export function useStationTypes(apiBaseUrl: string) {
	const query = useStationTypesQuery(apiBaseUrl);

	return {
		stationTypes: query.data,
		isPending: query.isPending,
		isError: query.isError,
		query,
	};
}

export function useStationTypeCounts(apiBaseUrl: string): {
	stationCountsByType: Map<string, number> | undefined;
	isPending: boolean;
	isError: boolean;
} {
	const {stationTypes, isPending, isError} = useStationTypes(apiBaseUrl);
	const stationCountsByType = useMemo(() => {
		if (stationTypes === undefined) {
			return undefined;
		}

		return new Map(
			stationTypes.map((entry) => [entry.type, entry.station_count]),
		);
	}, [stationTypes]);

	return {
		stationCountsByType,
		isPending,
		isError,
	};
}

export function useStationsQuery(appId: string) {
	const appConfig = useAppConfig(appId);

	return useQuery({
		queryKey: [
			"count-aggregator",
			appId,
			"stations",
			appConfig.apiBaseUrl,
			appConfig.stationType,
		],
		queryFn: async () => {
			const client = createCountAggregatorClient(appConfig.apiBaseUrl);
			const response = await listStations(client, appConfig.stationType);
			return mapStationList(response);
		},
		staleTime: STALE_TIME_MS,
	});
}

export function useStations(appId: string): Map<number, Station> | undefined {
	return useStationsQuery(appId).data;
}

export function useLastValues(
	appId: string,
	request: {
		stationIds: readonly number[];
		resolution: Resolution;
		limit?: number;
		startDate?: string;
		metrics?: readonly BucketMetric[];
	},
	options?: {enabled?: boolean},
): AggregatedValuesData | undefined {
	const appConfig = useAppConfig(appId);
	const metrics = normalizeSelectedMetrics(
		request.metrics,
		appConfig.defaultMetric ?? "sum",
	);

	const req = useMemo(() => {
		if (request.stationIds.length === 0) {
			return null;
		}

		return {
			stationIds: request.stationIds,
			resolution: request.resolution,
			limit: request.limit,
			startDate: request.startDate,
			metrics,
		};
	}, [
		request.stationIds,
		request.resolution,
		request.limit,
		request.startDate,
		metrics,
	]);

	const {data} = useQuery({
		queryKey: [
			"count-aggregator",
			appId,
			"last-values",
			appConfig.apiBaseUrl,
			appConfig.stationType,
			req,
		],
		queryFn: async () => {
			const client = createCountAggregatorClient(appConfig.apiBaseUrl);
			const response = await getLastValues(client, {
				type: appConfig.stationType,
				resolution: req!.resolution,
				stationIds: req!.stationIds,
				limit: req!.limit,
				startDate: req!.startDate,
				metrics: req!.metrics,
			});
			return mapTimeSeriesMap(response, req!.metrics);
		},
		staleTime: STALE_TIME_MS,
		enabled: (options?.enabled ?? true) && req !== null,
	});

	return data;
}

export function useAggregatedValues(
	appId: string,
	request: Partial<ValuesRequest>,
	options?: {enabled?: boolean},
): AggregatedValuesData | undefined {
	const appConfig = useAppConfig(appId);
	const resolution =
		request.resolution ?? appConfig.defaultResolution ?? "daily";
	const metrics = normalizeSelectedMetrics(
		request.metrics,
		appConfig.defaultMetric ?? "sum",
	);

	const req = useMemo(() => {
		if (
			request.stationIds !== undefined &&
			request.startDate !== undefined &&
			request.endDate !== undefined &&
			request.stationIds.length > 0
		) {
			return {
				stationIds: request.stationIds,
				from: dateToYmd(request.startDate),
				to: dateToYmd(request.endDate),
				resolution,
				metrics,
			};
		}

		return null;
	}, [
		request.stationIds,
		request.startDate,
		request.endDate,
		resolution,
		metrics,
	]);

	const {data} = useQuery({
		queryKey: [
			"count-aggregator",
			appId,
			"values",
			appConfig.apiBaseUrl,
			appConfig.stationType,
			req,
		],
		queryFn: async () => {
			const client = createCountAggregatorClient(appConfig.apiBaseUrl);
			const response = await getValues(client, {
				type: appConfig.stationType,
				from: req!.from,
				to: req!.to,
				resolution: req!.resolution,
				stationIds: req!.stationIds,
				metrics: req!.metrics,
			});
			return mapTimeSeriesMap(response, req!.metrics);
		},
		staleTime: STALE_TIME_MS,
		enabled: (options?.enabled ?? true) && req !== null,
	});

	return data;
}

export function useTrafficEvents(
	appId: string,
	startDate: Date | null,
	endDate: Date | null,
): UseQueryResult<TrafficEventsData> {
	const appConfig = useAppConfig(appId);
	const eventsEndpoint = appConfig.endpoints?.events;

	return useQuery({
		queryKey: [
			"count-aggregator",
			appId,
			"events",
			eventsEndpoint,
			startDate,
			endDate,
		],
		queryFn: async () => {
			if (eventsEndpoint === undefined) {
				return {manualEvents: []};
			}

			const startDateStr = dateToYmd(startDate!);
			const endDateStr = dateToYmd(endDate!);
			const response = await fetch(
				`${eventsEndpoint}/${startDateStr}/${endDateStr}`,
				{headers: {Accept: "application/json"}},
			);

			if (!response.ok) {
				throw new Error(
					`Events request failed with HTTP ${response.status}`,
				);
			}

			return parseTrafficEventsResponse(await response.json());
		},
		staleTime: 3600 * 1000,
		enabled:
			eventsEndpoint !== undefined &&
			startDate !== null &&
			endDate !== null,
	});
}

export function usePresetsQuery(appId: string) {
	const appConfig = useAppConfig(appId);
	const presetsEndpoint = appConfig.endpoints?.presets;

	return useQuery({
		queryKey: ["count-aggregator", appId, "presets", presetsEndpoint],
		queryFn: async () => {
			if (presetsEndpoint === undefined) {
				return [];
			}

			const response = await fetch(presetsEndpoint, {
				headers: {Accept: "application/json"},
			});

			if (!response.ok) {
				throw new Error(
					`Presets request failed with HTTP ${response.status}`,
				);
			}

			return parsePresetsResponse(await response.json());
		},
		staleTime: STALE_TIME_MS,
		enabled: presetsEndpoint !== undefined,
	});
}

export function usePresets(appId: string): PresetData[] | undefined {
	return usePresetsQuery(appId).data;
}
