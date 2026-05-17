import unique from "@mapsight/lib-js/array/unique";
import {isTruthy} from "@mapsight/lib-js/boolean";
import {ensureNonNullable} from "@mapsight/lib-js/nonNullable";

import mapSelectorPart from "./mapSelectorPart.ts";

/**
 * Finds
 * A) Words incl. whitespace enclosed by matching single quotes ('), square brackets ([,]), not (:not(,)) or matching double quotes (") and
 * B) Words (groups of non-whitespace characters)
 *
 * @type {RegExp}
 */
const REGEX_SELECTOR_PART: RegExp = /('.*?'|\[.*?]|:not\(.*?\)|".*?"|\S+)/g;

export type Selector = ReturnType<typeof mapSelector>;

export default function mapSelector(selector: string) {
	const selectorParts = ensureNonNullable(selector.match(REGEX_SELECTOR_PART))
		.map((part) => mapSelectorPart(part))
		.filter(isTruthy);
	const checks = unique(
		selectorParts.map((a) => "check" in a && a.check).filter(isTruthy),
	);
	const mergedStateNames = unique(
		selectorParts
			.map((part) =>
				"stateNames" in part.__meta
					? part.__meta.stateNames
					: undefined,
			)
			.filter(isTruthy)
			.flat(),
	);
	const mergedStyleProps = unique(
		selectorParts
			.map((part) =>
				"styleProps" in part.__meta
					? part.__meta.styleProps
					: undefined,
			)
			.filter(isTruthy)
			.flat(),
	);
	const mergedStylePropExpressions = unique(
		selectorParts
			.map((part) =>
				"stylePropExpressions" in part.__meta
					? part.__meta.stylePropExpressions
					: undefined,
			)
			.filter(isTruthy)
			.flat(),
	);

	let style;
	let state;
	let group;
	for (const part of selectorParts) {
		if (!state && "group" in part) group = part.group;
		if (!style && "style" in part) style = part.style;
		if (!state && "state" in part) state = part.state;
		if (state && style && group) break;
	}

	return {
		style: style,
		state: state,
		group: group || "default",
		checks: checks?.length ? checks : undefined,

		__meta: {
			stateNames: mergedStateNames,
			styleProps: mergedStyleProps,
			stylePropExpressions: mergedStylePropExpressions,
		},
	};
}
