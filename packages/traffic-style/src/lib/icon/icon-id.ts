import {hasPictogram} from "../pictograms/index.ts";
import {pickContrastForeground} from "./contrast.ts";
import {resolveSpec} from "./resolve.ts";

export type IconVariant = "default" | "small" | "xsmall" | "plain";

export type IconColors = {
	background?: string;
	foreground?: string;
};

export type IconSpec = {
	variant?: IconVariant;
	pictogram?: string;
	label?: string;
	colors?: IconColors;
};

const DEFAULT_RUNTIME_ICON = "marker";
const COLOR_SEGMENT = /^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i;
const LETTER_OR_NUMBER_ID = /^[0-9a-z]$/;
const COMPACT_LABEL_ID = /^[0-9a-zA-Z]{1,2}$/;

function normalizeColorSegment(value: string | undefined): string | undefined {
	if (!value) {
		return undefined;
	}
	const trimmed = value.trim();
	return COLOR_SEGMENT.test(trimmed) ? trimmed : undefined;
}

function specFromIconIdSegment(
	iconId: string,
	options: Pick<IconSpec, "variant" | "colors"> = {},
): IconSpec {
	const base: IconSpec = {...options};

	if (hasPictogram(iconId)) {
		return {...base, pictogram: iconId};
	}

	if (LETTER_OR_NUMBER_ID.test(iconId)) {
		const label = /^\d$/.test(iconId) ? iconId : iconId.toUpperCase();
		return {...base, label};
	}

	if (COMPACT_LABEL_ID.test(iconId)) {
		return {...base, label: iconId.toUpperCase()};
	}

	return {...base, pictogram: iconId};
}

function withDefaultPictogramFallback(spec: IconSpec): IconSpec {
	if (spec.label || !spec.pictogram || hasPictogram(spec.pictogram)) {
		return spec;
	}

	const fallback = parseMapsightIcon(DEFAULT_RUNTIME_ICON);
	if (!fallback?.pictogram) {
		return spec;
	}

	return {
		...fallback,
		colors: spec.colors ?? fallback.colors,
	};
}

/** Parse a compact `mapsightIconId` value into an IconSpec. */
export function parseMapsightIcon(value: string): IconSpec | null {
	const trimmed = value.trim();
	if (!trimmed) {
		return null;
	}

	const [iconIdPart, backgroundPart, foregroundPart] = trimmed.split("/");
	const iconId = iconIdPart?.trim();
	if (!iconId) {
		return null;
	}

	const background = normalizeColorSegment(backgroundPart);
	const explicitForeground = normalizeColorSegment(foregroundPart);
	const colors: IconColors = {};

	if (background) {
		colors.background = background;
		colors.foreground =
			explicitForeground ?? pickContrastForeground(background);
	}

	return specFromIconIdSegment(
		iconId,
		Object.keys(colors).length > 0 ? {colors} : {},
	);
}

/** Serialize an IconSpec to the compact `mapsightIconId` form. */
export function formatMapsightIcon(spec: IconSpec): string {
	const iconId =
		spec.pictogram ??
		spec.label?.slice(0, 2).toUpperCase() ??
		spec.label?.trim();
	if (!iconId) {
		return "";
	}

	const background = spec.colors?.background;
	const foreground = spec.colors?.foreground;
	const resolved = resolveSpec({
		pictogram: spec.pictogram,
		label: spec.label,
		colors: spec.colors,
	});

	if (
		resolved.colors.background === resolveSpec({}).colors.background &&
		resolved.colors.foreground === resolveSpec({}).colors.foreground
	) {
		return iconId;
	}

	if (!background) {
		return iconId;
	}

	if (!foreground) {
		return `${iconId}/${background}`;
	}

	const autoForeground = pickContrastForeground(background);
	if (foreground.toLowerCase() === autoForeground.toLowerCase()) {
		return `${iconId}/${background}`;
	}

	return `${iconId}/${background}/${foreground}`;
}

/** Resolve a compact id + variant to the internal render spec. */
export function resolveMapsightIconSpec(
	mapsightIconId: string,
	variant?: IconVariant,
): IconSpec | null {
	const trimmed = mapsightIconId.trim();
	if (!trimmed) {
		return null;
	}

	const spec = withDefaultPictogramFallback(
		parseMapsightIcon(trimmed) ?? {pictogram: trimmed},
	);

	return variant ? {...spec, variant} : spec;
}
