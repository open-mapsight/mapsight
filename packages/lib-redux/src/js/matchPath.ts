import {zip} from "@mapsight/lib-js/array";

type PatternSegment = {isParam: boolean; name: string};

/**
 * Parses a pattern segment.
 *
 * @param patternSegment segment string
 * @returns parsed segment
 */
function parsePatternSegment(patternSegment: string): PatternSegment {
	if (patternSegment.startsWith(":")) {
		return {
			isParam: true,
			name: patternSegment.slice(1),
		};
	} else {
		return {
			isParam: false,
			name: patternSegment,
		};
	}
}

// TODO: lru/limit cache?
const parsePathPatternCache: Record<string, Array<PatternSegment>> = {};

/**
 * Parses a path pattern
 *
 * @param pattern path pattern
 * @returns parsed pattern
 */
function parsePathPattern(pattern: string): Array<PatternSegment> {
	const fromCache = parsePathPatternCache[pattern];
	if (fromCache !== undefined) {
		return fromCache;
	}

	const patternSegments = pattern.split("/").map(parsePatternSegment);
	parsePathPatternCache[pattern] = patternSegments;
	return patternSegments;
}

/**
 * This function matches the given path array to a path pattern. The pattern consists of / delimited names and/or
 * named parameters defined as `:name` where name may be any string which will be used in the returned object to
 * access the parameter value.
 *
 * If the path matches the pattern, the return value will be an object containing any present
 * named parameter values that may be in the pattern, otherwise it will return false if any path segment does not
 * match the specified pattern.
 *
 * @param pathArr path array
 * @param pattern pattern to match
 * @returns object containing matched named parameter values or false if the path did not patch the pattern
 */
export default function matchPath(
	pathArr: Array<string>,
	pattern: string,
): false | Record<string, string> {
	const patternSegments = parsePathPattern(pattern);
	if (patternSegments.length !== pathArr.length) {
		return false;
	}

	const params: Record<string, string> = {};

	for (const [pathValue, patternSegment] of zip(pathArr, patternSegments)) {
		if (patternSegment.isParam) {
			params[patternSegment.name] = pathValue;
		} else if (pathValue !== patternSegment.name) {
			return false;
		}
	}

	return params;
}
