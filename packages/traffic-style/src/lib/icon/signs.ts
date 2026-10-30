import type {IconColors, IconVariant} from "./icon-id.ts";
import {signs} from "./signs/catalog.ts";

export function hasSignIcon(id: string): boolean {
	return Object.hasOwn(signs, id);
}

function escapeColor(color: string | undefined): string | undefined {
	return color
		?.replaceAll("&", "&amp;")
		.replaceAll('"', "&quot;")
		.replaceAll("<", "&lt;");
}

/** Reuse the original SVG layers, including size-specific artwork and fallback glyphs. */
export function composeSignMarkup(
	id: string,
	variant: IconVariant,
	colors: IconColors = {},
): string | null {
	if (!hasSignIcon(id)) {
		return null;
	}
	return signs[id]![variant]({
		background: escapeColor(colors.background),
		foreground: escapeColor(colors.foreground),
		border: escapeColor(colors.border),
	});
}
