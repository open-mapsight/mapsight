import {signLayers, signRecipes} from "../../generated/signs.ts";
import type {IconColors, IconVariant} from "./icon-id.ts";

export function hasSignIcon(id: string): boolean {
	return Object.hasOwn(signRecipes, id);
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
	return signRecipes[id]![variant].map((index) => signLayers[index]!)
		.join("")
		.replace(
			/\{\{(background|foreground|border):([^}]+)\}\}/g,
			(_match, role: keyof IconColors, original: string) => {
				const color = colors[role] ?? original;
				return color
					.replaceAll("&", "&amp;")
					.replaceAll('"', "&quot;")
					.replaceAll("<", "&lt;");
			},
		);
}
