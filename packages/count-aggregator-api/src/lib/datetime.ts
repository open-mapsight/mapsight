import type {TimeSeriesResponse} from "../types.js";

export const LOCAL_DATE_TIME_PATTERN =
	/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/;

export function parseLocalDateTime(value: string): Date {
	const match = LOCAL_DATE_TIME_PATTERN.exec(value);
	if (match === null) {
		throw new Error(
			`Expected local datetime "Y-m-d H:i:s", got "${value}"`,
		);
	}

	return new Date(
		Date.UTC(
			Number(match[1]),
			Number(match[2]) - 1,
			Number(match[3]),
			Number(match[4]),
			Number(match[5]),
			Number(match[6]),
			0,
		),
	);
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
