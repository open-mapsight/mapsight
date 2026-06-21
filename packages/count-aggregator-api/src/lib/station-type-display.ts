import type {StationTypeSummary} from "../types.js";

export interface StationTypeDisplay {
	/** Human label for the primary measured quantity (e.g. Pegelmessung). */
	primaryMetricLabel: string;
	/** Physical unit for chart/table display; null for dimensionless counters. */
	valueUnit: string | null;
	/** Decimal places for citizen-facing values in charts and summaries. */
	displayPrecision: number;
}

function pickPrimaryMetric(entry: StationTypeSummary) {
	return (
		entry.metrics.find(
			(metric) => metric.defaultMetric === entry.defaultMetric,
		) ?? entry.metrics[0]
	);
}

/**
 * Derive one display unit and precision per station type from platform metadata.
 *
 * Uses the metric whose `defaultMetric` matches the type's `defaultMetric`.
 * All metrics on a type are expected to share the same physical unit; mixed units
 * should be fixed upstream rather than handled in UI forks.
 */
export function resolveStationTypeDisplay(
	entry: StationTypeSummary,
): StationTypeDisplay {
	const primaryMetric = pickPrimaryMetric(entry);

	if (primaryMetric === undefined) {
		return {
			primaryMetricLabel: entry.label,
			valueUnit: null,
			displayPrecision: 0,
		};
	}

	return {
		primaryMetricLabel: primaryMetric.label,
		valueUnit: primaryMetric.unit,
		displayPrecision: primaryMetric.displayPrecision,
	};
}
