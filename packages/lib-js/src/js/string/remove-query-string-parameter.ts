import {escapeRegExp} from "../regExp.ts";

/**
 * Remove a single key-value-pair from query string
 *
 * @param uri uri to parse
 * @param key key to remove
 * @returns uri without key
 */
export default function removeQueryStringParameter(
	uri: string,
	key: string,
): string {
	const re = new RegExp("([?&])" + escapeRegExp(key) + "=.*?(&|$)", "i");

	return uri.match(re)
		? uri
				.replace(re, "$1") // remove key if exists
				.replace(/[?&]$/, "") // remove trailing separator
		: uri;
}
