import type {IconVariant} from "../icon/icon-id.ts";

/** Stable cache key for a compact id + variant pair. */
export const mapsightIconCacheKey = (
	mapsightIconId: string,
	variant: IconVariant = "default",
) => `${mapsightIconId}|${variant}`;
