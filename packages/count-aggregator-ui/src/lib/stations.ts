import type {Station} from "../types";

const TRAILING_METRIC_SUFFIX_PATTERN = /\s+\([^)]+\)$/;

export function formatStationLabel(station: Station | undefined): string {
	if (station === undefined) {
		return "...";
	}

	return (
		station.label?.replace(TRAILING_METRIC_SUFFIX_PATTERN, "") ||
		station.originId
	);
}
