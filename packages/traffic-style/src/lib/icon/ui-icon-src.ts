import {composeSvg} from "./compose.ts";
import {type IconVariant, resolveMapsightIconSpec} from "./icon-id.ts";
import {resolveSpec} from "./resolve.ts";
import {getTemplate} from "./templates.ts";

const SVG_DATA_URL_PREFIX = "data:image/svg+xml;charset=utf-8,";

export type UiIconSrc = {
	src: string;
	width: number;
	height: number;
};

/** Sync composed SVG for UI chrome. Does not rasterize. */
export function uiIconSrc(
	mapsightIconId: string,
	variant: IconVariant = "plain",
): UiIconSrc | null {
	const spec = resolveMapsightIconSpec(mapsightIconId, variant);
	if (!spec) {
		return null;
	}

	const template = getTemplate(resolveSpec(spec).variant);
	return {
		src: `${SVG_DATA_URL_PREFIX}${encodeURIComponent(composeSvg(spec))}`,
		width: template.width,
		height: template.height,
	};
}
