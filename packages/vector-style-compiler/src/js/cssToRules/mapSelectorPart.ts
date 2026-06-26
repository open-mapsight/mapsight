import trimQuotes from "@mapsight/lib-js/string/trimQuotes";

import {
	featurePropPathMeta,
	parseFeaturePropPath,
} from "../helpers/parseFeaturePropPath.ts";
import {splitAttributeSelectorContent} from "../helpers/tokenizeSelector.ts";
import mapValue from "./mapValue.ts";

type JsCheck = {
	type: "js";
	expression: string;
	negate: boolean;
};

type GeometryTypeCheck = {
	type: "geometryType";
	value: string;
	negate: boolean;
};

type ValueCheck = {
	type: "value";
	target: "props" | "env";
	path: string[];
	value?: string | number | null;
	negate: boolean;
};

export type Check = JsCheck | GeometryTypeCheck | ValueCheck;

function mapAttributeSelectorPart(
	part: string,
	negate = false,
): {
	check: Check;
	__meta: {
		styleProps?: string[];
		stylePropExpressions?: string[];
		stateNames?: string[];
	};
} {
	const [leftHandOperand, rawRightHandOperand] = splitAttributeSelectorContent(
		part.slice(1, -1),
	);
	const rightHandOperand =
		rawRightHandOperand !== undefined
			? trimQuotes(rawRightHandOperand)
			: undefined;

	// special case: js expression
	if (leftHandOperand.startsWith("|js")) {
		return {
			check: {
				type: "js",
				expression: rightHandOperand || "",
				negate,
			},
			__meta: {},
		};
	}

	// special case: geometry type
	if (leftHandOperand === "geometry|type") {
		const {value, __meta: valueMeta} = mapValue(rightHandOperand);

		return {
			check: {
				type: "geometryType",
				value: String(value ?? ""),
				negate,
			},
			__meta: valueMeta,
		};
	}

	const {target, path} = parseFeaturePropPath(leftHandOperand, "selector");

	// keep track of props used for styling
	let stateNames: string[] = [];
	let {styleProps, stylePropExpressions} = featurePropPathMeta(target, path);

	let value = undefined;
	if (rightHandOperand !== undefined) {
		const mappedValue = mapValue(rightHandOperand);
		value = mappedValue.value;
		styleProps = styleProps.concat(mappedValue.__meta.styleProps);
		stylePropExpressions = stylePropExpressions.concat(
			mappedValue.__meta.stylePropExpressions,
		);

		if (path.length === 1 && path[0] === "state") {
			stateNames = [rightHandOperand];
		}
	}

	return {
		check: {
			type: "value",
			target,
			path,
			value,
			negate,
		},
		__meta: {
			stateNames: stateNames,
			styleProps: styleProps,
			stylePropExpressions: stylePropExpressions,
		},
	};
}

export default function mapSelectorPart(part: string, negate = false) {
	// Handle :not(...) negation using recursion
	if (part.startsWith(":not(") && part.endsWith(")")) {
		const inner = part.slice(5, -1).trim(); // remove :not( and )
		return mapSelectorPart(inner, !negate);
	}

	const firstLetter = part.charAt(0);
	if (firstLetter === "[") {
		return mapAttributeSelectorPart(part, negate);
	}

	if (negate) {
		throw new Error(
			"Cannot negate selector part [" + part + "] with :not().",
		);
	}

	if (firstLetter === "*") {
		return {__meta: {}} as const;
	}

	const rest = part.slice(1);
	if (firstLetter === ":") {
		return {state: rest, __meta: {}} as const;
	}

	if (firstLetter === "#") {
		return {style: rest, __meta: {}} as const;
	}

	if (firstLetter === ".") {
		return {group: rest, __meta: {}} as const;
	}

	return null;
}
