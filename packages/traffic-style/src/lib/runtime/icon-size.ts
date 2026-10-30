import {type IconVariant, resolveMapsightIconSpec} from "../icon/icon-id.ts";
import {getIconLayout} from "../icon/layout.ts";
import {RUNTIME_ICON_PIXEL_RATIO} from "../icon/resolve.ts";

/** Physical bitmap size, available synchronously even while the image is pending. */
export function mapsightRuntimeIconSize(
	mapsightIconId: unknown,
	variant: IconVariant = "default",
	axis: "width" | "height" = "width",
): number {
	const spec =
		typeof mapsightIconId === "string"
			? resolveMapsightIconSpec(mapsightIconId, variant)
			: null;
	const {template} = getIconLayout(spec ?? {variant});
	return Math.round(template[axis] * RUNTIME_ICON_PIXEL_RATIO);
}
