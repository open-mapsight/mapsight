export const STATION_COLORS = [
	"#6390ba",
	"#62a155",
	"#c48049",
	"#7276cf",
	"#d95272",
	"#b09f1e",
	"#2b908f",
	"#519c95",
] as const;

export function getColorForStationIndex(index: number | null = null): string {
	if (index === null) {
		return "#000";
	}

	return STATION_COLORS[index % STATION_COLORS.length] ?? "#6390ba";
}

export const CHART_COLORS = STATION_COLORS.map((color) => ({
	color,
})) as Array<{color: string}>;
