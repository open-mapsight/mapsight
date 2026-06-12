import {z} from "zod";

import {schemas} from "../generated/client.js";
import type {TimeSeriesMapResponse, TimeSeriesResponse} from "../types.js";

const LOCAL_DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

const timeSeriesMapSchema = z.record(z.string(), schemas.TimeSeriesResponse);

export function parseTimeSeriesMap(value: unknown): TimeSeriesMapResponse {
	return timeSeriesMapSchema.parse(value);
}

export function indexTimeSeriesByStationId(
	map: TimeSeriesMapResponse,
): Map<number, TimeSeriesResponse> {
	const indexed = new Map<number, TimeSeriesResponse>();

	for (const [key, entry] of Object.entries(map)) {
		const stationId = Number(key);
		if (!Number.isInteger(stationId)) {
			throw new Error(
				`Expected time series map key to be an integer station id, got "${key}"`,
			);
		}
		if (entry.id !== stationId) {
			throw new Error(
				`Time series map key ${stationId} does not match entry.id ${entry.id}`,
			);
		}
		indexed.set(stationId, entry);
	}

	return indexed;
}

export function assertLocalDateTimeFields(series: TimeSeriesResponse): void {
	for (const field of [
		"fromDateTime",
		"toDateTime",
		"lastDateTime",
	] as const) {
		if (!LOCAL_DATE_TIME_PATTERN.test(series[field])) {
			throw new Error(
				`Expected ${field} in Y-m-d H:i:s format, got "${series[field]}"`,
			);
		}
	}

	for (const point of series.values) {
		if (!LOCAL_DATE_TIME_PATTERN.test(point.datetime)) {
			throw new Error(
				`Expected values[].datetime in Y-m-d H:i:s format, got "${point.datetime}"`,
			);
		}
	}
}
