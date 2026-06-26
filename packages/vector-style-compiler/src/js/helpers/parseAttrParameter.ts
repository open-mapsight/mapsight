import trimQuotes from "@mapsight/lib-js/string/trimQuotes";

import {
	type FeaturePropPath,
	hasExplicitAttrPrefix,
	parseFeaturePropPath,
} from "./parseFeaturePropPath.ts";

export type {FeaturePropPath as AttrParameter};

/**
 * Parse the argument of attr(...).
 *
 * In SCSS, quote arguments that contain `|`, e.g. attr("prop|stroke-width").
 */
export default function parseAttrParameter(parameter: string): FeaturePropPath {
	const trimmed = parameter.trim();
	const unquoted = trimQuotes(trimmed);
	const wasQuoted = unquoted !== trimmed;

	if (wasQuoted && !hasExplicitAttrPrefix(unquoted)) {
		return {target: "props", path: [unquoted]};
	}

	return parseFeaturePropPath(unquoted, "attr");
}
