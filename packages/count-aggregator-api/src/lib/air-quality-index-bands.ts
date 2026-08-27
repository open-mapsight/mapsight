/**
 * German UBA Luftqualitätsindex (LQI) class colors and labels.
 *
 * Colors follow the widely published `deu_uba` palette (e.g. Google Air Quality
 * API / UBA Luftqualität presentation). Band boundaries map continuous platform
 * index scores onto the five official classes via floor into `[1, 5]`.
 *
 * Concentration→index conversion stays server-side; this module only classifies
 * already-computed index values for UI and (later) map styling.
 *
 * @see https://www.umweltbundesamt.de/themen/luft/luftqualitaet/der-luftqualitaetsindex-lqi
 */

export type AirQualityIndexBandId = 1 | 2 | 3 | 4 | 5;

export type AirQualityIndexBandKey =
	"veryGood" | "good" | "moderate" | "poor" | "veryPoor";

export interface AirQualityIndexBand {
	id: AirQualityIndexBandId;
	key: AirQualityIndexBandKey;
	/** Official UBA presentation color. */
	color: string;
	labelDe: string;
	labelEn: string;
}

export const AIR_QUALITY_INDEX_BANDS = [
	{
		id: 1,
		key: "veryGood",
		color: "#50F0E6",
		labelDe: "sehr gut",
		labelEn: "very good",
	},
	{
		id: 2,
		key: "good",
		color: "#50CDAA",
		labelDe: "gut",
		labelEn: "good",
	},
	{
		id: 3,
		key: "moderate",
		color: "#F0E641",
		labelDe: "mäßig",
		labelEn: "moderate",
	},
	{
		id: 4,
		key: "poor",
		color: "#FF5050",
		labelDe: "schlecht",
		labelEn: "poor",
	},
	{
		id: 5,
		key: "veryPoor",
		color: "#960032",
		labelDe: "sehr schlecht",
		labelEn: "very poor",
	},
] as const satisfies readonly AirQualityIndexBand[];

const BAND_BY_ID = new Map<AirQualityIndexBandId, AirQualityIndexBand>(
	AIR_QUALITY_INDEX_BANDS.map((band) => [band.id, band]),
);

export function isAirQualityIndexStationType(stationType: string): boolean {
	return (
		stationType.startsWith("airQuality") && stationType.endsWith("Index")
	);
}

export function isAirQualityIndexUnit(
	unit: string | null | undefined,
): boolean {
	return typeof unit === "string" && unit.trim().toLowerCase() === "index";
}

/**
 * Map a continuous platform index score to a UBA class.
 * Values in `[n, n+1)` belong to class `n` (clamped to 1–5).
 */
export function resolveAirQualityIndexBand(
	value: number,
): AirQualityIndexBand | undefined {
	if (!Number.isFinite(value) || value < 1) {
		return undefined;
	}

	const id = Math.min(5, Math.floor(value)) as AirQualityIndexBandId;
	return BAND_BY_ID.get(id);
}

export function airQualityIndexBandColor(value: number): string | undefined {
	return resolveAirQualityIndexBand(value)?.color;
}

export function airQualityIndexBandLabel(
	value: number,
	locale: "de" | "en" = "de",
): string | undefined {
	const band = resolveAirQualityIndexBand(value);
	if (band === undefined) {
		return undefined;
	}

	return locale === "en" ? band.labelEn : band.labelDe;
}
