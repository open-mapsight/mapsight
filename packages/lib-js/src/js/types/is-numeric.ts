import isNumberLike from "./isNumberLike.ts";

/**
 * Historic `@mapsight/lib-js/types/is-numeric` entry.
 *
 * @deprecated Prefer {@link isNumberLike}. Removed in the next major of
 *   `@mapsight/lib-js` (package itself is also on a long-term sunset path).
 */
export default function isNumeric(value: unknown): boolean {
	return isNumberLike(value);
}
