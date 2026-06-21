import type {
	BucketMetric,
	Resolution,
	ResponseFormat,
	StationType,
} from "../types.js";

export interface MultipleValuesRequest {
	type: StationType;
	from: string;
	to: string;
	resolution: Resolution;
	stationIds: readonly number[];
	format?: ResponseFormat;
	metrics?: readonly BucketMetric[];
}

export interface MultipleValuesQueryRequest {
	type: StationType;
	from: string;
	to: string;
	resolution: Resolution;
	stationIds: readonly number[];
	format?: ResponseFormat;
	metrics?: readonly BucketMetric[];
}

export interface MultipleLastValuesRequest {
	type: StationType;
	resolution: Resolution;
	stationIds: readonly number[];
	limit?: number;
	startDate?: string;
	anchor?: "lastDataAt";
	format?: ResponseFormat;
	metrics?: readonly BucketMetric[];
}

export interface SingleStationValuesRequest {
	type: StationType;
	stationId: number;
	from: string;
	to: string;
	resolution: Resolution;
	metrics?: readonly BucketMetric[];
}

export interface SingleStationLastValuesRequest {
	type: StationType;
	stationId: number;
	resolution: Resolution;
	limit?: number;
	startDate?: string;
	anchor?: "lastDataAt";
	metrics?: readonly BucketMetric[];
}

function trimTrailingSlash(baseUrl: string): string {
	return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

function joinMetrics(
	metrics: readonly BucketMetric[] | undefined,
): string | undefined {
	return metrics !== undefined && metrics.length > 0
		? metrics.join(",")
		: undefined;
}

function appendQueryString(
	path: string,
	params: Record<string, string | number | undefined>,
): string {
	const searchParams = new URLSearchParams();

	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined) {
			searchParams.set(key, String(value));
		}
	}

	const query = searchParams.toString();
	return query.length > 0 ? `${path}?${query}` : path;
}

export function buildMultipleValuesUrl(
	baseUrl: string,
	request: MultipleValuesRequest,
): string {
	const path = `${trimTrailingSlash(baseUrl)}/${request.type}/values/${request.from}/${request.to}/${request.resolution}`;

	return appendQueryString(path, {
		stationIds: request.stationIds.join(","),
		format: request.format,
		metrics: joinMetrics(request.metrics),
	});
}

export function buildMultipleValuesQueryUrl(
	baseUrl: string,
	request: MultipleValuesQueryRequest,
): string {
	const path = `${trimTrailingSlash(baseUrl)}/${request.type}/values`;

	return appendQueryString(path, {
		stationIds: request.stationIds.join(","),
		from: request.from,
		to: request.to,
		resolution: request.resolution,
		format: request.format,
		metrics: joinMetrics(request.metrics),
	});
}

export function buildMultipleLastValuesUrl(
	baseUrl: string,
	request: MultipleLastValuesRequest,
): string {
	const path = `${trimTrailingSlash(baseUrl)}/${request.type}/last-values/${request.resolution}`;

	return appendQueryString(path, {
		stationIds: request.stationIds.join(","),
		limit: request.limit,
		startDate: request.startDate,
		anchor: request.anchor,
		format: request.format,
		metrics: joinMetrics(request.metrics),
	});
}

export function buildSingleStationValuesUrl(
	baseUrl: string,
	request: SingleStationValuesRequest,
): string {
	const path = `${trimTrailingSlash(baseUrl)}/${request.type}/${request.stationId}/values/${request.from}/${request.to}/${request.resolution}`;

	return appendQueryString(path, {
		metrics: joinMetrics(request.metrics),
	});
}

export function buildSingleStationLastValuesUrl(
	baseUrl: string,
	request: SingleStationLastValuesRequest,
): string {
	const path = `${trimTrailingSlash(baseUrl)}/${request.type}/${request.stationId}/last-values/${request.resolution}`;

	return appendQueryString(path, {
		limit: request.limit,
		startDate: request.startDate,
		anchor: request.anchor,
		metrics: joinMetrics(request.metrics),
	});
}

export function buildStationSumsUrl(
	baseUrl: string,
	type: StationType,
	stationId: number,
): string {
	return `${trimTrailingSlash(baseUrl)}/${type}/${stationId}/sums`;
}

export function buildCsvExportUrl(
	baseUrl: string,
	request: Omit<MultipleValuesRequest, "format">,
): string {
	return buildMultipleValuesUrl(baseUrl, {...request, format: "csv"});
}

export function buildValuesQueryCsvExportUrl(
	baseUrl: string,
	request: Omit<MultipleValuesQueryRequest, "format">,
): string {
	return buildMultipleValuesQueryUrl(baseUrl, {...request, format: "csv"});
}

export function buildLastValuesCsvExportUrl(
	baseUrl: string,
	request: Omit<MultipleLastValuesRequest, "format">,
): string {
	return buildMultipleLastValuesUrl(baseUrl, {...request, format: "csv"});
}

export function buildStationsUrl(baseUrl: string, type: StationType): string {
	return `${trimTrailingSlash(baseUrl)}/${type}/stations`;
}

export function buildStationsGeoJsonUrl(
	baseUrl: string,
	type: StationType,
): string {
	const path = `${trimTrailingSlash(baseUrl)}/stations.geojson`;

	return appendQueryString(path, {type});
}
