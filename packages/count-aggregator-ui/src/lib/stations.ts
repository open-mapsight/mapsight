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

export interface StationLabelParts {
	/** Display name from `formatStationLabel`. */
	name: string;
	/** Set only when another station shares `name`. */
	disambiguator?: {
		field: "sectionDescription" | "typeName" | "originId" | "id";
		value: string;
	};
}

const DISAMBIGUATOR_FIELDS = [
	"sectionDescription",
	"typeName",
	"originId",
] as const;

/** Resolve duplicate display names using only metadata present on the stations. */
export function resolveStationLabelParts(
	stations: Iterable<Station>,
): Map<number, StationLabelParts> {
	const groups = new Map<string, Station[]>();
	for (const station of stations) {
		const name = formatStationLabel(station);
		const group = groups.get(name) ?? [];
		group.push(station);
		groups.set(name, group);
	}

	const parts = new Map<number, StationLabelParts>();
	for (const [name, group] of groups) {
		if (group.length === 1) {
			parts.set(group[0]!.id, {name});
			continue;
		}
		const field = DISAMBIGUATOR_FIELDS.find((key) => {
			const values = group.map((station) => station[key]?.trim());
			return (
				values.every(Boolean) && new Set(values).size === group.length
			);
		});
		for (const station of group) {
			parts.set(station.id, {
				name,
				disambiguator:
					field === undefined
						? {field: "id", value: String(station.id)}
						: {field, value: station[field]!.trim()},
			});
		}
	}
	return parts;
}

export function formatStationLabelParts({
	name,
	disambiguator,
}: StationLabelParts): string {
	return disambiguator === undefined
		? name
		: `${name} — ${disambiguator.value}`;
}

/** Display labels for all stations; duplicate names get a ` — ` disambiguator. */
export function buildStationLabels(
	stations: Iterable<Station>,
): Map<number, string> {
	return new Map(
		Array.from(resolveStationLabelParts(stations), ([id, parts]) => [
			id,
			formatStationLabelParts(parts),
		]),
	);
}
