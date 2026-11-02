import type {IconColors, IconVariant} from "../icon-id.ts";

/** Final composition markup at the standard dimensions for each icon variant. */
export type SignArtwork = Record<IconVariant, string>;

export type SignSvg = {
	viewBox: string;
	width: number;
	height: number;
	markup: string;
};
export type SignAsset = Record<IconVariant, SignSvg>;

/** Fixed placement in the base's coordinate system, including optical adjustments. */
export type SignPlacement = Record<
	IconVariant,
	{x: number; y: number; width: number; height: number}
>;

export type SignComposition = {
	base: string;
	glyph?: string;
	placement?: string;
};

export function combineArtwork(
	base: SignAsset,
	glyph?: SignAsset,
	placement?: SignPlacement,
): SignArtwork {
	const render = (variant: IconVariant) => {
		if (!glyph) return base[variant].markup;
		if (!placement)
			throw new Error("A sign glyph needs explicit placement metadata");
		const {x, y, width, height} = placement[variant];
		const svg = glyph[variant];
		return (
			base[variant].markup +
			`<svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="${svg.viewBox}" preserveAspectRatio="none" overflow="visible">${svg.markup}</svg>`
		);
	};
	return {
		default: render("default"),
		small: render("small"),
		xsmall: render("xsmall"),
		plain: render("plain"),
	};
}

/** Only explicit data-sign-fill/stroke bindings accept overrides; literal paints stay fixed. */
export function applySignColors(markup: string, colors: IconColors): string {
	return markup.replace(/<[^>]+>/g, (source) => {
		let tag = source;
		for (const binding of source.matchAll(
			/\sdata-sign-(fill|stroke)="(background|foreground|border)"/g,
		)) {
			const paint = binding[1]!;
			const color = colors[binding[2] as keyof IconColors];
			if (color !== undefined) {
				tag = tag.replace(
					new RegExp(`\\s${paint}="[^"]*"`),
					() => ` ${paint}="${color}"`,
				);
			}
		}
		return tag.replace(/\sdata-sign-(?:fill|stroke)="[^"]*"/g, "");
	});
}
