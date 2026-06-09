import type {
	DeclarationLeaf,
	DeclarationNode,
} from "./cssToRules/mapDeclaration.ts";
import type {Check} from "./cssToRules/mapSelectorPart.ts";
import {
	type BlockTree,
	compileDeclarationBlock,
} from "./helpers/compileDeclarationBlock.ts";
import pathToExpression from "./helpers/pathToExpression.ts";
import type {Child, Tree, TreeLeaf} from "./rulesToTree.ts";

const dict = "abcdefghijklmnopqrstuvwxyz";
function aliasName(n: number): string {
	if (n < 1) throw new Error("n must be greater than 0");

	let result = "";
	let i = n;

	while (i > 0) {
		const j = (i - 1) % dict.length;

		// Prepend the character to fix the read-order direction
		result = dict[j] + result;

		// Divide instead of subtract to shift to the next base digit
		i = Math.floor((i - 1) / dict.length);
	}
	return `$${result}`;
}

function indent(depth: number = 0): [string, string, string] {
	return [
		"\n" + "\t".repeat(depth),
		"\n" + "\t".repeat(depth + 1),
		"\n" + "\t".repeat(depth + 2),
	];
}

function encodeDeclarationNode(
	node: DeclarationNode | DeclarationLeaf | null | undefined,
): BlockTree | null {
	if (!node) {
		return null;
	}

	return Object.fromEntries(
		Object.entries(node).map(([key, node]) => {
			if (node === null) {
				return ["value", null];
			}
			return [
				key,
				typeof node === "object"
					? encodeDeclarationNode(
							node as DeclarationNode | DeclarationLeaf,
						)
					: node,
			];
		}),
	);
}

function checkToExpression(check: Check, aliases?: Map<string, string>) {
	switch (check.type) {
		case "js":
			return check.expression;
		case "geometryType":
			return `geometryType == ${check.value}`;
		case "value": {
			const realProperty = pathToExpression(check.target, check.path);
			let property = realProperty;
			if (aliases) {
				if (aliases.has(property)) {
					property = aliases.get(property)! + `/* ${realProperty} */`;
				} else {
					const alias = aliasName(aliases.size + 1);
					aliases.set(property, alias);
					property = `${alias}/* ${realProperty} */`;
				}
			}

			return "value" in check
				? `${property} == ${check.value}`
				: property;
		}
	}
}

function checkToExpressionWithAlias(
	check: Check,
	aliases: Map<string, string>,
): string {
	const expression = checkToExpression(check, aliases);
	if (aliases.has(expression)) {
		return aliases.get(expression)!;
	}
	const alias = aliasName(aliases.size + 1);
	aliases.set(expression, alias);
	return alias;
}

function buildConditionExpression(child: Child, aliases: Map<string, string>) {
	const expressions = child.conditions.map((checks) => {
		const checkExpression = checks.map((check) => {
			const expression = checkToExpressionWithAlias(check, aliases);
			return check.negate ? `!${expression}` : expression;
		});

		return checkExpression.length > 1
			? `(${checkExpression.join(" && ")})`
			: checkExpression[0];
	});

	return expressions.length > 1
		? `(${expressions.join(" || ")})`
		: expressions[0];
}

export default function treeToProgram(
	tree: Tree,
	target = "declaration",
	baseIndent = 0,
) {
	let declarationCounter = 0;

	function programDeclarationBody(
		subTree: Child | TreeLeaf,
		depth: number,
		aliases: Map<string, string>,
	) {
		const [_] = indent(depth);

		let result = "";
		declarationCounter++;

		if (target === "hash") {
			result += `${_}h(${declarationCounter});`;

			if (subTree.stylePropExpressions) {
				subTree.stylePropExpressions.forEach((stylePropExpression) => {
					let alias: string;
					if (aliases.has(stylePropExpression)) {
						alias = aliases.get(stylePropExpression)!;
					} else {
						alias = aliasName(aliases.size + 1);
						aliases.set(stylePropExpression, alias);
					}

					result += `${_}h('@' + createHash(${alias}));`;
				});
			}
		}

		if (target === "declaration") {
			const block = encodeDeclarationNode(subTree.declarations);
			if (block) {
				result += compileDeclarationBlock(block, "d", _);
			}
		}

		return result;
	}

	function stateToProgram(subTree: Tree[string][string], depth = 0) {
		const [_] = indent(depth);
		const aliases = new Map<string, string>();
		let program = "";
		if (subTree.declarations) {
			program += programDeclarationBody(subTree, depth, aliases);
		}

		if (subTree.children) {
			const programParts = subTree.children.map((child): string => {
				const expression = buildConditionExpression(child, aliases);
				return `if (${expression}) {${programDeclarationBody(child, depth + 2, aliases)}${_}}`;
			});

			if (programParts.length) {
				program += `${_}${programParts.join(_)}`;
			}
		}

		const aliasesPrograms = Array.from(aliases.entries()).map(
			([expression, alias]) => `const ${alias} = ${expression};`,
		);

		if (aliasesPrograms.length) {
			program = `${_}{${_}${aliasesPrograms.join(_)}${_}${program}${_}}`;
		}

		return program;
	}

	function styleToProgram(subTree: Tree[string], depth = 0) {
		const cases = Object.keys(subTree).filter((a) => a !== "default");
		const [_, __, ___] = indent(depth);

		return (
			(subTree.default ? stateToProgram(subTree.default, depth) : "") +
			(cases.length
				? `${_}switch (state) {${cases.map((a) => `${__}case '${a}':${stateToProgram(subTree[a]!, depth + 2)}${___}break;`).join("")}${_}}`
				: "")
		);
	}

	function stylesToProgram(rootTree: Tree, depth = 0) {
		const cases = Object.keys(rootTree).filter((a) => a !== "default");
		const [_, __, ___] = indent(depth);

		return (
			(rootTree.default ? styleToProgram(rootTree.default, depth) : "") +
			(cases.length
				? `${_}switch (style) {${cases.map((a) => `${__}case '${a}':${styleToProgram(rootTree[a]!, depth + 2)}${___}break;`).join("")}${_}}`
				: "")
		);
	}

	return stylesToProgram(tree, baseIndent);
}
