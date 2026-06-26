import trimQuotes from "@mapsight/lib-js/string/trimQuotes";

import pathToExpression from "./pathToExpression.ts";

export type FeaturePropTarget = "props" | "env";

export type FeaturePropPath = {
	target: FeaturePropTarget;
	path: string[];
};

export type ParseFeaturePropPathMode = "selector" | "attr";

const ENV_PROP_LITERAL_PREFIX = "env-prop|";
const ENV_SELECTOR_PREFIX = "env|";
const ENV_ATTR_PREFIX = "--env-";
const PROPS_SELECTOR_PREFIX = "props|";
const PROP_LITERAL_PREFIX = "prop|";

/** Whether an attr(...) operand uses an explicit prefix (not plain quoted text). */
export function hasExplicitAttrPrefix(operand: string): boolean {
	return (
		operand.startsWith(ENV_PROP_LITERAL_PREFIX) ||
		operand.startsWith(ENV_ATTR_PREFIX) ||
		operand.startsWith(PROP_LITERAL_PREFIX)
	);
}

/**
 * Split a segment on hyphens unless it is a quoted literal key.
 */
export function parsePropPathSegment(segment: string): string[] {
	const trimmed = segment.trim();
	const unquoted = trimQuotes(trimmed);

	if (unquoted !== trimmed) {
		return [unquoted];
	}

	return trimmed.split("-");
}

/**
 * Parse a feature or env property reference from a selector attribute name
 * or an attr(...) argument (after any attr-specific quote handling).
 */
export function parseFeaturePropPath(
	operand: string,
	mode: ParseFeaturePropPathMode,
): FeaturePropPath {
	let rest = operand.trim();
	let target: FeaturePropTarget = "props";

	if (rest.startsWith(ENV_PROP_LITERAL_PREFIX)) {
		return {
			target: "env",
			path: [rest.slice(ENV_PROP_LITERAL_PREFIX.length)],
		};
	}

	if (mode === "selector" && rest.startsWith(ENV_SELECTOR_PREFIX)) {
		target = "env";
		rest = rest.slice(ENV_SELECTOR_PREFIX.length);
	} else if (mode === "attr" && rest.startsWith(ENV_ATTR_PREFIX)) {
		return {
			target: "env",
			path: parsePropPathSegment(rest.slice(ENV_ATTR_PREFIX.length)),
		};
	}

	if (mode === "selector" && rest.startsWith(PROPS_SELECTOR_PREFIX)) {
		rest = rest.slice(PROPS_SELECTOR_PREFIX.length);
	}

	if (rest.startsWith(PROP_LITERAL_PREFIX)) {
		return {target, path: [rest.slice(PROP_LITERAL_PREFIX.length)]};
	}

	return {target, path: parsePropPathSegment(rest)};
}

/** Metadata for allowedProps and declaration hashing. */
export function featurePropPathMeta(
	target: FeaturePropTarget,
	path: string[],
): {
	styleProps: string[];
	stylePropExpressions: string[];
} {
	if (target !== "props" || !path[0]) {
		return {styleProps: [], stylePropExpressions: []};
	}

	const expression = pathToExpression(target, path);
	return {
		styleProps: [path[0]],
		stylePropExpressions: [expression],
	};
}
