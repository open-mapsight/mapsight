import matchPath from "./matchPath";

const noMatch: Record<string, string> = {};

/**
 * This function matches the given path array to a path pattern. The pattern consists of / delimited names and/or
 * named parameters defined as `:name` where name may be any string which will be used in the returned object to
 * access the parameter value.
 *
 * If the path matches the pattern it will return an object containing any present
 * named parameter values that may be in the pattern otherwise an empty object is returned.
 *
 * @param pathArr path array
 * @param pattern pattern to match
 * @returns 2-ary array with boolean that is true if the path did match the pattern and an object containing matched named parameter values
 */
export default function matchesPath(
	pathArr: Array<string>,
	pattern: string,
): [boolean, Record<string, string>] {
	const match = matchPath(pathArr, pattern);
	return match ? [true, match] : [false, noMatch];
}
