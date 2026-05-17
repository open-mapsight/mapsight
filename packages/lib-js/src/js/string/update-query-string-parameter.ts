import {escapeRegExp, escapeRegExpReplace} from "../regExp.ts";

/**
 * Set a value for a single key in query string
 *
 * @param uri uri to parse
 * @param key key to update or set
 * @param value new value to set. it will get transformed with encodeURI()
 * @returns uri with the key and new value
 */
export default function updateQueryStringParameter(
	uri: string,
	key: string,
	value: string,
): string {
	value = encodeURI(value);
	const re = new RegExp("([?&])" + escapeRegExp(key) + "=.*?(&|$)", "i");
	const separator = uri.indexOf("?") !== -1 ? "&" : "?";
	return uri.match(re)
		? uri.replace(
				re,
				"$1" +
					escapeRegExpReplace(key) +
					"=" +
					escapeRegExpReplace(value) +
					"$2",
			)
		: uri + separator + key + "=" + value;
}
