export type NodeValue = {value: string | number | boolean | null};

export type BlockTree = {
	[property: string]: BlockTree | NodeValue | null;
};

const isValueNode = (node: unknown): node is NodeValue =>
	node !== null && typeof node === "object" && "value" in node;

const getPropertyAccess = (key: string): string => {
	const isValidIdentifier = /^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(key);
	return isValidIdentifier ? `.${key}` : `["${key}"]`;
};

/**
 * Compiles a parsed Style AST block into highly optimized JS assignments.
 * @param ast The parsed style block
 * @param rootName The name of the base object (default: "declaration")
 * @param indent String used for indentation
 */
export function compileDeclarationBlock(
	ast: BlockTree,
	rootName: string = "declaration",
	indent: string = "  ",
): string {
	const lines: string[] = [];

	function traverse(node: BlockTree, parentRef: string, path: string[]) {
		for (const [key, child] of Object.entries(node)) {
			const access = getPropertyAccess(key);

			if (child === null) {
				lines.push(`${indent}${parentRef}${access} = null;`);
				continue;
			}

			if (isValueNode(child)) {
				lines.push(
					`${indent}${parentRef}${access} = { value: ${child.value} };`,
				);
			} else {
				const newPath = [...path, key];
				const cacheVar =
					"_" +
					newPath
						.map((p) => p.replace(/[^a-zA-Z0-9]/g, ""))
						.join("_");

				lines.push(
					`${indent}const ${cacheVar} = (${indent}${parentRef}${access} ??= {});`,
				);

				traverse(child, cacheVar, newPath);
			}
		}
	}

	traverse(ast, rootName, []);
	return lines.join("");
}
