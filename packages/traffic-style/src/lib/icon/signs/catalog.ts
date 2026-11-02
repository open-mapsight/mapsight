import {signBases, signGlyphs} from "../../../generated/sign-artwork.ts";
import compositions from "../../../signs/compositions.json" with {type: "json"};
import {combineArtwork} from "./definition.ts";
import type {
	SignArtwork,
	SignAsset,
	SignComposition,
	SignPlacement,
} from "./definition.ts";

const bases: Record<string, SignAsset> = signBases;
const glyphs: Record<string, SignAsset> = signGlyphs;
const metadata: {
	placements: Record<string, SignPlacement>;
	icons: Record<string, SignComposition>;
} = compositions;

export const signs: Record<string, SignArtwork> = Object.fromEntries(
	Object.entries(metadata.icons).map(([id, definition]) => {
		const base = bases[definition.base];
		if (!base) throw new Error(`Unknown sign base: ${definition.base}`);
		const glyph = definition.glyph ? glyphs[definition.glyph] : undefined;
		const placement = definition.placement
			? metadata.placements[definition.placement]
			: undefined;
		if (definition.glyph && (!glyph || !placement))
			throw new Error(`Incomplete sign composition: ${id}`);
		return [id, combineArtwork(base, glyph, placement)];
	}),
);
