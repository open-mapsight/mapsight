import type {CountAggregatorClient} from "./client.js";
import type {
	BucketMetric,
	Resolution,
	StationListResponse,
	StationOverviewResponse,
	StationType,
	StationTypeListResponse,
	TimeSeriesMapResponse,
	TimeSeriesResponse,
} from "./types.js";

export interface ListStationsOptions {
	includeEmpty?: boolean;
}

export interface ValuesRequest {
	type: StationType;
	from: string;
	to: string;
	resolution: Resolution;
	stationIds: readonly number[];
	metrics?: readonly BucketMetric[];
}

export interface ValuesQueryRequest {
	type: StationType;
	from: string;
	to: string;
	resolution: Resolution;
	stationIds: readonly number[];
	metrics?: readonly BucketMetric[];
}

export interface LastValuesRequest {
	type: StationType;
	resolution: Resolution;
	stationIds: readonly number[];
	limit?: number;
	startDate?: string;
	anchor?: "lastDataAt";
	metrics?: readonly BucketMetric[];
}

export interface StationLastValuesRequest {
	type: StationType;
	stationId: string | number;
	resolution: Resolution;
	limit?: number;
	startDate?: string;
	anchor?: "lastDataAt";
	metrics?: readonly BucketMetric[];
}

function joinStationIds(stationIds: readonly number[]): string {
	return stationIds.join(",");
}

function joinMetrics(
	metrics: readonly BucketMetric[] | undefined,
): string | undefined {
	return metrics !== undefined && metrics.length > 0
		? metrics.join(",")
		: undefined;
}

export function listStationTypes(
	client: CountAggregatorClient,
): Promise<StationTypeListResponse> {
	return client["count-aggregator.public.station-types"]();
}

export function listStations(
	client: CountAggregatorClient,
	type: StationType,
	options: ListStationsOptions = {},
): Promise<StationListResponse> {
	return client["count-aggregator.public.type.stations"]({
		params: {type},
		queries: {
			includeEmpty: options.includeEmpty,
		},
	});
}

export function getValues(
	client: CountAggregatorClient,
	request: ValuesRequest,
): Promise<TimeSeriesMapResponse> {
	return client["count-aggregator.public.type.values"]({
		params: {
			type: request.type,
			from: request.from,
			to: request.to,
			resolution: request.resolution,
		},
		queries: {
			stationIds: joinStationIds(request.stationIds),
			metrics: joinMetrics(request.metrics),
		},
	});
}

export function getValuesQuery(
	client: CountAggregatorClient,
	request: ValuesQueryRequest,
): Promise<TimeSeriesMapResponse> {
	return client["count-aggregator.public.type.values.query"]({
		params: {
			type: request.type,
		},
		queries: {
			stationIds: joinStationIds(request.stationIds),
			from: request.from,
			to: request.to,
			resolution: request.resolution,
			metrics: joinMetrics(request.metrics),
		},
	});
}

export function getLastValues(
	client: CountAggregatorClient,
	request: LastValuesRequest,
): Promise<TimeSeriesMapResponse> {
	return client["count-aggregator.public.type.last-values"]({
		params: {
			type: request.type,
			resolution: request.resolution,
		},
		queries: {
			stationIds: joinStationIds(request.stationIds),
			limit: request.limit,
			startDate: request.startDate,
			anchor: request.anchor,
			metrics: joinMetrics(request.metrics),
		},
	});
}

export function getStationLastValues(
	client: CountAggregatorClient,
	request: StationLastValuesRequest,
): Promise<TimeSeriesResponse> {
	return client["count-aggregator.public.type.station.last-values"]({
		params: {
			type: request.type,
			stationId: request.stationId,
			resolution: request.resolution,
		},
		queries: {
			limit: request.limit,
			startDate: request.startDate,
			anchor: request.anchor,
			metrics: joinMetrics(request.metrics),
		},
	});
}

export function getStationSums(
	client: CountAggregatorClient,
	type: StationType,
	stationId: string | number,
): Promise<StationOverviewResponse> {
	return client["count-aggregator.public.type.sums"]({
		params: {type, stationId},
	});
}
