import type {Declaration, Rule} from "postcss";

import unique from "@mapsight/lib-js/array/unique";
import {isTruthy} from "@mapsight/lib-js/boolean";
import deepMerge from "@mapsight/lib-js/object/deep-extend";

import uniqueSerialized from "../helpers/uniqueSerialized.ts";
import type {DeclarationNode} from "./mapDeclaration.ts";
import mapDeclaration from "./mapDeclaration.ts";
import mapSelector, {type Selector} from "./mapSelector.ts";

const isDeclaration = (val: Rule["nodes"][number]): val is Declaration =>
	val.type === "decl";

const isRule = (val: Rule["nodes"][number]): val is Rule => val.type === "rule";

const isPropertyRule = (rule: Rule) => /^[A-Za-z_][\w-]*$/.test(rule.selector);

function mapRuleDeclarations(
	rule: Rule,
	prefix: Array<string> = [],
): Array<ReturnType<typeof mapDeclaration>> {
	const declarations =
		rule.nodes
			?.filter(isDeclaration)
			.map((declaration) => mapDeclaration(declaration, prefix))
			.filter((a) => !!a) ?? [];

	const nestedDeclarations =
		rule.nodes
			?.filter(isRule)
			.filter(isPropertyRule)
			.flatMap((nestedRule) =>
				mapRuleDeclarations(nestedRule, [
					...prefix,
					nestedRule.selector,
				]),
			) ?? [];

	return [...declarations, ...nestedDeclarations];
}

export default function mapRule(rule: Rule) {
	const declarations = mapRuleDeclarations(rule);

	const mergedDeclaration: DeclarationNode = deepMerge(
		{},
		...declarations.map((a) => a.declaration),
	);

	// meta data
	const mergedDeclarationNames = unique(
		declarations.map((declaration) => declaration.__meta.name),
	);
	const mergedStyleProps = unique(
		declarations.flatMap((declaration) => declaration.__meta.styleProps),
	);
	const mergedStylePropExpressions = unique(
		declarations.flatMap(
			(declaration) => declaration.__meta.stylePropExpressions,
		),
	);
	const mergedVolatileCalcExpressions = unique(
		declarations.flatMap(
			(declaration) => declaration.__meta.volatileCalcExpressions,
		),
	);

	const selectors = uniqueSerialized(rule.selectors.map(mapSelector));
	const groupedSelectors: Record<string, Array<Selector>> = {};
	selectors.forEach((selector) => {
		const existing = groupedSelectors[selector.group];
		if (Array.isArray(existing)) {
			existing.push(selector);
		} else {
			groupedSelectors[selector.group] = [selector];
		}
	});

	return Object.keys(groupedSelectors).map((group) => {
		const conditions = uniqueSerialized(groupedSelectors[group]!);
		const mergedStateNames = unique(
			conditions.flatMap((condition) => condition.__meta.stateNames),
		);
		const mergedConditionStyleProps = unique(
			conditions.flatMap((condition) => condition.__meta.styleProps),
		);
		const mergedConditionStylePropExpressions = unique(
			conditions.flatMap(
				(condition) => condition.__meta.stylePropExpressions,
			),
		);

		return {
			conditions: conditions,
			declarations: {
				[group]: mergedDeclaration,
			},

			__meta: {
				styleNames: unique(
					conditions
						.map((condition) => condition.style)
						.filter(isTruthy),
				),
				stateNames: [
					...unique(
						conditions
							.map((condition) => condition.state)
							.filter(isTruthy),
					),
					...mergedStateNames,
				],
				groupNames: unique(
					conditions.map((condition) => condition.group),
				),
				declarationNames: mergedDeclarationNames,
				styleProps: [...mergedConditionStyleProps, ...mergedStyleProps],
				stylePropExpressions: [
					...mergedConditionStylePropExpressions,
					...mergedStylePropExpressions,
				],
				volatileCalcExpressions: mergedVolatileCalcExpressions,
			},
		};
	});
}
