import type {CountAggregatorClient} from "./client.js";
import type {
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
}

export interface LastValuesRequest {
	type: StationType;
	resolution: Resolution;
	stationIds: readonly number[];
	limit?: number;
	startDate?: string;
}

export interface StationLastValuesRequest {
	type: StationType;
	stationId: string | number;
	resolution: Resolution;
	limit?: number;
	startDate?: string;
	anchor?: "lastDataAt";
}

function joinStationIds(stationIds: readonly number[]): string {
	return stationIds.join(",");
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
