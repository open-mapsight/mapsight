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

const themedStationColors = STATION_COLORS.map(
	(color, index) => `var(--msca-chart-color-${index + 1}, ${color})`,
);

export function getColorForStationIndex(index: number | null = null): string {
	if (index === null) {
		return "#000";
	}

	return (
		themedStationColors[index % themedStationColors.length] ??
		STATION_COLORS[0]
	);
}

export const CHART_COLORS = themedStationColors.map((color) => ({
	color,
})) as Array<{color: string}>;
