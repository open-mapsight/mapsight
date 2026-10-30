export type PictogramSource = "traffic-style" | "fontawesome";

export type PictogramPack = PictogramSource;

export type PictogramGlyph = {
	/** SVG viewBox — supports "minX minY width height" for non-normalized glyphs. */
	viewBox: string;
	markup: string;
	source: PictogramSource;
	/** Extra inset inside the content slot (0–0.4). */
	padding?: number;
};

/** A single glyph or a compact horizontal row inside one shared marker. */
export type PictogramDefinition = {
	id: string;
	label?: Record<string, string>;
	source: PictogramSource;
} & (
	| (PictogramGlyph & {composition?: never})
	| {
			composition: {
				layout: "horizontal";
				/** Each glyph uses an unchanged, variant-sized content slot. */
				glyphs: readonly [
					PictogramGlyph,
					PictogramGlyph,
					...PictogramGlyph[],
				];
			};
			viewBox?: never;
			markup?: never;
			padding?: never;
	  }
);

export function pictogramPackForIconId(iconId: string): PictogramPack {
	return iconId.startsWith("fa-") ? "fontawesome" : "traffic-style";
}
