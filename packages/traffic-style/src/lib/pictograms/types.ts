export type PictogramSource = "traffic-style" | "fontawesome";

export type PictogramPack = PictogramSource;

export type PictogramDefinition = {
	id: string;
	label?: Record<string, string>;
	/** SVG viewBox — supports "minX minY width height" for non-normalized glyphs. */
	viewBox: string;
	markup: string;
	source: PictogramSource;
	/** Extra inset inside the content slot (0–0.4). */
	padding?: number;
};

export function pictogramPackForIconId(iconId: string): PictogramPack {
	return iconId.startsWith("fa-") ? "fontawesome" : "traffic-style";
}
