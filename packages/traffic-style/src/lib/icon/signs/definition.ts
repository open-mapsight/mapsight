import type {IconColors, IconVariant} from "../icon-id.ts";

/** Authored SVG at the standard dimensions for each icon variant. */
export type SignArtwork = Record<IconVariant, (colors: IconColors) => string>;

export function combineArtwork(
	base: SignArtwork,
	symbol: SignArtwork,
): SignArtwork {
	return {
		default: (colors) => base.default(colors) + symbol.default(colors),
		small: (colors) => base.small(colors) + symbol.small(colors),
		xsmall: (colors) => base.xsmall(colors) + symbol.xsmall(colors),
		plain: (colors) => base.plain(colors) + symbol.plain(colors),
	};
}
