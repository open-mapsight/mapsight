import type {Resolution, ResponseFormat, StationType} from "../types.js";

export interface MultipleValuesRequest {
	type: StationType;
	from: string;
	to: string;
	resolution: Resolution;
	stationIds: readonly number[];
	format?: ResponseFormat;
}

export interface MultipleLastValuesRequest {
	type: StationType;
	resolution: Resolution;
	stationIds: readonly number[];
	limit?: number;
	startDate?: string;
	anchor?: "lastDataAt";
	format?: ResponseFormat;
}

export interface SingleStationValuesRequest {
	type: StationType;
	stationId: number;
	from: string;
	to: string;
	resolution: Resolution;
}

export interface SingleStationLastValuesRequest {
	type: StationType;
	stationId: number;
	resolution: Resolution;
	limit?: number;
	startDate?: string;
	anchor?: "lastDataAt";
}

function trimTrailingSlash(baseUrl: string): string {
	return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
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
	});
}

export function buildSingleStationValuesUrl(
	baseUrl: string,
	request: SingleStationValuesRequest,
): string {
	return `${trimTrailingSlash(baseUrl)}/${request.type}/${request.stationId}/values/${request.from}/${request.to}/${request.resolution}`;
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
