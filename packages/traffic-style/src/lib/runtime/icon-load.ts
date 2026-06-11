import type {IconVariant} from "../icon/icon-id.ts";
import {defaultIconCache} from "./cache.ts";
import type {IconBitmap} from "./cache.ts";

/** Return a cached bitmap synchronously if already rasterized. */
export function getCachedIcon(
	mapsightIconId: string,
	variant?: IconVariant,
): IconBitmap | undefined {
	return defaultIconCache.getCached(mapsightIconId, variant);
}

/** Load an icon bitmap, awaiting rasterization when needed. */
export async function loadIcon(
	mapsightIconId: string,
	variant?: IconVariant,
): Promise<IconBitmap | null> {
	return defaultIconCache.get(mapsightIconId, variant);
}
