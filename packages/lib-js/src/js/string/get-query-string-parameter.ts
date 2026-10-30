import {escapeRegExp} from "../regExp.ts";

/**
 * Get value of a single query string parameter.
 *
 * @param uri uri to parse
 * @param key key to return value for
 * @returns decoded value, or the raw value when it is not valid percent-encoding
 */
export default function getQueryStringParameter(
	uri: string,
	key: string,
): string | null {
	const match = new RegExp(
		"(?:^|[?&])" + escapeRegExp(key) + "=(.*?)(?:&|$)",
		"i",
	).exec(uri);
	return match?.[1] ? decodeQueryValue(match[1]) : null;
}

function decodeQueryValue(value: string): string {
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
}
