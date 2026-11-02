import type {IconColors, IconVariant} from "../icon-id.ts";

/** Authored SVG markup at the standard dimensions for each icon variant. */
export type SignArtwork = Record<IconVariant, string>;

export function combineArtwork(
	base: SignArtwork,
	symbol: SignArtwork,
): SignArtwork {
	return {
		default: base.default + symbol.default,
		small: base.small + symbol.small,
		xsmall: base.xsmall + symbol.xsmall,
		plain: base.plain + symbol.plain,
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
