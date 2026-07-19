/**
 * Gets the value at `path` of `object`. If the resolved value is
 * `undefined`, the `defaultValue` is returned in its place.
 *
 * @static
 * @param object The object (incl. arrays) to query.
 * @param path The path of the property to get.
 * @param [defaultValue=undefined] The value returned for `undefined` resolved values.
 * @returns Returns the resolved value.
 * @example
 *
 * var object = {a: [{b: {c: 3}}]};
 * getPath(object, ['a', '0', 'b', 'c']);
 * // => 3
 */
export default function getPath(
	object: object | Array<unknown> | null | undefined,
	path: Array<string | number | symbol>,
	defaultValue: unknown = undefined,
) {
	// no path can be resolved if object is null or undefined => return defaultValue
	if (object === null || object === undefined) {
		return defaultValue;
	}

	let index = 0;
	const length = path.length;

	let current: unknown = object;
	while (current !== null && current !== undefined && index < length) {
		const key = path[index++]!;
		current = (current as Record<string | number | symbol, unknown>)[key];
	}

	// Full path walked: return the value, or defaultValue when it is `undefined`
	// (including a missing final key — matches the documented / lodash-get behaviour).
	if (index && index === length) {
		return current !== undefined ? current : defaultValue;
	}

	return defaultValue;
}
