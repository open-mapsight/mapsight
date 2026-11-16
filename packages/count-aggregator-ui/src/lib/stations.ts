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

/** Resolve duplicate display names using only metadata present on the stations. */
export function buildStationLabels(
	stations: Iterable<Station>,
): Map<number, string> {
	const groups = new Map<string, Station[]>();
	for (const station of stations) {
		const label = formatStationLabel(station);
		const group = groups.get(label) ?? [];
		group.push(station);
		groups.set(label, group);
	}

	const labels = new Map<number, string>();
	for (const [label, group] of groups) {
		const fields = ["sectionDescription", "typeName", "originId"] as const;
		const field = fields.find((key) => {
			const values = group.map((station) => station[key]?.trim());
			return (
				values.every(Boolean) && new Set(values).size === group.length
			);
		});
		for (const station of group) {
			const suffix =
				field === undefined ? station.id : station[field]?.trim();
			labels.set(
				station.id,
				group.length === 1 ? label : `${label} — ${suffix}`,
			);
		}
	}
	return labels;
}
