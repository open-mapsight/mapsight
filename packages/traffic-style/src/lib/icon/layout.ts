import {getPictogram} from "../pictograms/index.ts";
import type {IconSpec} from "./icon-id.ts";
import {resolveSpec} from "./resolve.ts";
import {getTemplate} from "./templates.ts";

/** Shared geometry for SVG composition, bitmap rendering and style dimensions. */
export function getIconLayout(spec: IconSpec) {
	const resolved = resolveSpec(spec);
	const pictogram = resolved.pictogram
		? getPictogram(resolved.pictogram)
		: undefined;
	const glyphs = pictogram
		? pictogram.composition
			? pictogram.composition.glyphs
			: [pictogram]
		: [];
	const template = getTemplate(resolved.variant, Math.max(1, glyphs.length));
	return {resolved, template, glyphs};
}
