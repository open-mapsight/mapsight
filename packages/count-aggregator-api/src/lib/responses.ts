import {z} from "zod";

import {schemas} from "../generated/client.js";
import type {TimeSeriesMapResponse, TimeSeriesResponse} from "../types.js";

export {assertLocalDateTimeFields} from "./datetime.js";

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
