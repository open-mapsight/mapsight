// NOTE: As of 2022-04-29 [area-]square-[kilo]meter is not supported in Intl.NumberFormat
import type {FormatOptions} from "./formatLength";
import {formatLength} from "./formatLength";

/**
 * Format area
 *
 * @param area The area in square meters
 * @param options options
 * @returns Formatted area string
 */
export function formatArea(area: number, options?: FormatOptions) {
	return `${formatLength(area, options)}²`;
}
