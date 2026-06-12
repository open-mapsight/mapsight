import type {CSSProperties} from "react";

export interface CountAggregatorTheme {
	colors?: {
		primary?: string;
		primaryHover?: string;
		border?: string;
		mutedForeground?: string;
		dangerSurface?: string;
		surface?: string;
		surfaceMuted?: string;
	};
	radius?: string;
}

const THEME_VAR_MAP = {
	"colors.primary": "--msca-color-primary",
	"colors.primaryHover": "--msca-color-primary-hover",
	"colors.border": "--msca-color-border",
	"colors.mutedForeground": "--msca-color-muted-foreground",
	"colors.dangerSurface": "--msca-color-danger-surface",
	"colors.surface": "--msca-color-surface",
	"colors.surfaceMuted": "--msca-color-surface-muted",
	radius: "--msca-radius",
} as const;

export function createTheme(theme: CountAggregatorTheme): CSSProperties {
	const style: Record<string, string> = {};

	if (theme.colors?.primary !== undefined) {
		style[THEME_VAR_MAP["colors.primary"]] = theme.colors.primary;
	}

	if (theme.colors?.primaryHover !== undefined) {
		style[THEME_VAR_MAP["colors.primaryHover"]] = theme.colors.primaryHover;
	}

	if (theme.colors?.border !== undefined) {
		style[THEME_VAR_MAP["colors.border"]] = theme.colors.border;
	}

	if (theme.colors?.mutedForeground !== undefined) {
		style[THEME_VAR_MAP["colors.mutedForeground"]] =
			theme.colors.mutedForeground;
	}

	if (theme.colors?.dangerSurface !== undefined) {
		style[THEME_VAR_MAP["colors.dangerSurface"]] =
			theme.colors.dangerSurface;
	}

	if (theme.colors?.surface !== undefined) {
		style[THEME_VAR_MAP["colors.surface"]] = theme.colors.surface;
	}

	if (theme.colors?.surfaceMuted !== undefined) {
		style[THEME_VAR_MAP["colors.surfaceMuted"]] = theme.colors.surfaceMuted;
	}

	if (theme.radius !== undefined) {
		style[THEME_VAR_MAP.radius] = theme.radius;
	}

	return style as CSSProperties;
}
