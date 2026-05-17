import {escapeRegExp} from "../regExp.ts";

/**
 * Get value of a single query string parameter.
 *
 * @param uri uri to parse
 * @param key key to return value for
 * @returns value
 */
export default function getQueryStringParameter(
	uri: string,
	key: string,
): string | null {
	const match = new RegExp(
		"(?:^|[?&])" + escapeRegExp(key) + "=(.*?)(?:&|$)",
		"i",
	).exec(uri);
	return match?.[1] ? decodeURI(match[1]) : null;
}
