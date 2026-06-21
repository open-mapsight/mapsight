import type {
	BucketMetric,
	DataValuePoint,
} from "@mapsight/count-aggregator-api";

export function chartSeriesKey(
	stationId: number,
	metric: BucketMetric,
): string {
	return `station_${stationId}_${metric}`;
}

export function resolveBucketValue(
	point: DataValuePoint,
	metric: BucketMetric,
): number | null {
	const direct = point[metric];
	if (typeof direct === "number") {
		return direct;
	}

	if (typeof point.value === "number") {
		return point.value;
	}

	return null;
}

export function normalizeSelectedMetrics(
	selectedMetrics: readonly BucketMetric[] | undefined,
	fallbackMetric: BucketMetric,
): readonly BucketMetric[] {
	if (selectedMetrics !== undefined && selectedMetrics.length > 0) {
		return selectedMetrics;
	}

	return [fallbackMetric];
}
