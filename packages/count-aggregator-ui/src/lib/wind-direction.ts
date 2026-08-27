const CARDINALS_DE = [
	"N",
	"NNO",
	"NO",
	"ONO",
	"O",
	"OSO",
	"SO",
	"SSO",
	"S",
	"SSW",
	"SW",
	"WSW",
	"W",
	"WNW",
	"NW",
	"NNW",
] as const;

const CARDINALS_EN = [
	"N",
	"NNE",
	"NE",
	"ENE",
	"E",
	"ESE",
	"SE",
	"SSE",
	"S",
	"SSW",
	"SW",
	"WSW",
	"W",
	"WNW",
	"NW",
	"NNW",
] as const;

/** Normalize meteorological degrees (0 = north, clockwise) into `[0, 360)`. */
export function normalizeWindDegrees(degrees: number): number | undefined {
	if (!Number.isFinite(degrees)) {
		return undefined;
	}

	const normalized = degrees % 360;
	return normalized < 0 ? normalized + 360 : normalized;
}

export function windDirectionCardinal(
	degrees: number,
	locale: "de" | "en" = "de",
): string | undefined {
	const normalized = normalizeWindDegrees(degrees);
	if (normalized === undefined) {
		return undefined;
	}

	const index = Math.round(normalized / 22.5) % 16;
	return (locale === "en" ? CARDINALS_EN : CARDINALS_DE)[index];
}

export function formatWindDirection(
	degrees: number,
	locale: "de" | "en" = "de",
): string | undefined {
	const normalized = normalizeWindDegrees(degrees);
	if (normalized === undefined) {
		return undefined;
	}

	const cardinal = windDirectionCardinal(normalized, locale);
	const rounded = Math.round(normalized);
	return cardinal === undefined ? `${rounded}°` : `${cardinal} (${rounded}°)`;
}
