import type {ChartSeries, DataResolution} from "../types";

export type ChartDataRow = {date: number} & Record<string, number | null>;

const MAX_GAP_ROWS = 5_000;

/** Calendar buckets follow local dates, like the API's local datetimes. */
function stepTimestamp(
	timestamp: number,
	resolution: DataResolution,
	steps = 1,
): number {
	const date = new Date(timestamp);
	switch (resolution) {
		case "5min":
			return timestamp + steps * 5 * 60_000;
		case "15min":
			return timestamp + steps * 15 * 60_000;
		case "hourly":
			return timestamp + steps * 60 * 60_000;
		case "daily":
			return date.setDate(date.getDate() + steps);
		case "weekly":
			return date.setDate(date.getDate() + steps * 7);
		case "monthly":
		case "yearly": {
			const day = date.getDate();
			const isMonthEnd =
				day ===
				new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
			date.setDate(1);
			date.setMonth(
				date.getMonth() + steps * (resolution === "monthly" ? 1 : 12),
			);
			const lastDay = new Date(
				date.getFullYear(),
				date.getMonth() + 1,
				0,
			).getDate();
			return date.setDate(
				resolution === "monthly" && isMonthEnd
					? lastDay
					: Math.min(day, lastDay),
			);
		}
	}
}

export function mergeSeriesData(
	series: readonly ChartSeries[],
	resolution: DataResolution,
): ChartDataRow[] {
	const byTimestamp = new Map<number, ChartDataRow>();
	const emptyValues = Object.fromEntries(series.map(({key}) => [key, null]));
	const createRow = (date: number): ChartDataRow => ({...emptyValues, date});

	for (const entry of series) {
		for (const {date, value} of entry.values) {
			const ts = date.getTime();
			if (!Number.isFinite(ts)) continue;
			const row = byTimestamp.get(ts) ?? createRow(ts);
			row[entry.key] = Number.isFinite(value) ? value : null;
			byTimestamp.set(ts, row);
		}
	}

	const rows = [...byTimestamp.values()].sort((a, b) => a.date - b.date);
	const result: ChartDataRow[] = [];
	let gapRows = 0;
	for (const [index, row] of rows.entries()) {
		const previous = rows[index - 1];
		if (previous !== undefined) {
			let steps = 1;
			let next = stepTimestamp(previous.date, resolution, steps);
			// Always retain a break marker, even after the expansion budget is used.
			if (next < row.date) {
				result.push(createRow(next));
				gapRows += 1;
				next = stepTimestamp(previous.date, resolution, ++steps);
				while (next < row.date && gapRows < MAX_GAP_ROWS) {
					result.push(createRow(next));
					gapRows += 1;
					next = stepTimestamp(previous.date, resolution, ++steps);
				}
			}
		}
		result.push(row);
	}
	return result;
}
