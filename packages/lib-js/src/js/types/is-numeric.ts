import isNumberLike from "./isNumberLike.ts";

/**
 * Historic `@mapsight/lib-js/types/is-numeric` entry.
 * Prefer {@link isNumberLike} for new code.
 */
export default function isNumeric(value: unknown): boolean {
	return isNumberLike(value);
}
