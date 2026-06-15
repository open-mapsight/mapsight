import type {Station} from "../types";

function hasWhitespaceBeforeSuffix(
	label: string,
	suffixStart: number,
): boolean {
	return suffixStart > 0 && label.charAt(suffixStart - 1).trim() === "";
}

function trimTrailingMetricSuffix(label: string): string {
	if (!label.endsWith(")")) {
		return label;
	}

	const suffixStart = label.lastIndexOf("(");
	if (
		suffixStart <= 0 ||
		suffixStart >= label.length - 2 ||
		!hasWhitespaceBeforeSuffix(label, suffixStart)
	) {
		return label;
	}

	let labelEnd = suffixStart;
	while (labelEnd > 0 && label.charAt(labelEnd - 1).trim() === "") {
		labelEnd -= 1;
	}

	return label.slice(0, labelEnd);
}

export function formatStationLabel(station: Station | undefined): string {
	if (station === undefined) {
		return "...";
	}

	return (
		(station.label === null
			? undefined
			: trimTrailingMetricSuffix(station.label)) || station.originId
	);
}
