import {composeSvg} from "./compose.ts";
import type {IconSpec} from "./icon-id.ts";
import {rasterizeSvg} from "./rasterize.ts";
import {RUNTIME_ICON_PIXEL_RATIO, resolveSpec} from "./resolve.ts";
import {getTemplate} from "./templates.ts";

export type RenderedIconBitmap = {
	dataUrl: string;
	width: number;
	height: number;
	logicalWidth: number;
	logicalHeight: number;
	pixelRatio: number;
};

/** Compose and rasterize an icon spec to a bitmap. */
export async function renderIconBitmap(
	spec: IconSpec,
): Promise<RenderedIconBitmap> {
	const resolved = resolveSpec(spec);
	const template = getTemplate(resolved.variant);
	const svg = composeSvg(spec);
	const raster = await rasterizeSvg(
		svg,
		template.width,
		template.height,
		RUNTIME_ICON_PIXEL_RATIO,
	);

	return {
		dataUrl: raster.dataUrl,
		width: raster.width,
		height: raster.height,
		logicalWidth: template.width,
		logicalHeight: template.height,
		pixelRatio: RUNTIME_ICON_PIXEL_RATIO,
	};
}
