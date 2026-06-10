import deepExtend from "@mapsight/lib-js/object/deep-extend";

import type {Rules} from "./cssToRules.ts";
import type {DeclarationNode} from "./cssToRules/mapDeclaration.ts";
import type {Check} from "./cssToRules/mapSelectorPart.ts";

export type TreeLeaf = {
	declarations?: DeclarationNode;
	children: Child[];
	stylePropExpressions?: Array<string>;
	volatileCalcExpressions?: Array<string>;
};

export type Child = {
	conditions: Array<Array<Check>>;
	declarations?: DeclarationNode;
	stylePropExpressions?: Array<string>;
	volatileCalcExpressions?: Array<string>;
};

export type Tree = {
	[style: string]: {
		[state: string]: TreeLeaf;
	};
};

export default function rulesToTree(rules: Rules["rules"]) {
	const tree: Tree = {};

	rules.forEach((rule) => {
		const ruleTree: Record<
			string,
			Record<string, Array<Array<Check>>>
		> = {};

		rule.conditions.forEach((condition) => {
			const style = condition.style || "default";
			const state = condition.state || "default";

			ruleTree[style] ??= {};
			ruleTree[style][state] ??= [];

			if (condition.checks) {
				ruleTree[style][state].push(condition.checks);
			}
		});

		Object.keys(ruleTree).forEach((style) => {
			const sub = ruleTree[style];
			if (!sub) {
				return;
			}

			const styleTree = tree[style] || {};
			Object.keys(sub).forEach((state) => {
				const stateTree: Tree[string][string] = styleTree[state] ?? {
					children: [],
				};

				const conditions = sub[state];
				if (conditions?.length) {
					stateTree.children.push({
						conditions: conditions,
						declarations: rule.declarations,
						stylePropExpressions: rule.__meta.stylePropExpressions,
						volatileCalcExpressions:
							rule.__meta.volatileCalcExpressions,
					});
					styleTree[state] = stateTree;
					return;
				}
				stateTree.stylePropExpressions = (
					stateTree.stylePropExpressions || []
				).concat(rule.__meta.stylePropExpressions);
				stateTree.volatileCalcExpressions = (
					stateTree.volatileCalcExpressions || []
				).concat(rule.__meta.volatileCalcExpressions);

				stateTree.declarations = deepExtend(
					stateTree.declarations || {},
					rule.declarations,
				);

				styleTree[state] = stateTree;
			});
			tree[style] = styleTree;
		});
	});

	return tree;
}
