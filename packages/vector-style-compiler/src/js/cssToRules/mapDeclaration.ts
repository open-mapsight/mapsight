import type {Declaration as CssDeclaration} from "postcss";

import mapValue from "./mapValue.ts";

export type DeclarationLeaf = {value: string | number | null};

export interface DeclarationNode {
	[key: string]: DeclarationNode | DeclarationLeaf;
}

export type Declaration = {
	declaration: DeclarationNode;
	__meta: ReturnType<typeof mapValue>["__meta"] & {
		name: string;
	};
};

export default function mapDeclaration(
	declaration: CssDeclaration,
): Declaration {
	const {value, __meta: valueMeta} = mapValue(declaration.value);

	if (!declaration.prop) {
		throw new Error("Declaration is lacking property");
	}

	const keyParts = declaration.prop.split("-");

	// build deep object
	const result: DeclarationNode = {};
	let current: DeclarationNode = result;
	for (let i = 0; i < keyParts.length - 1; i++) {
		const part = keyParts[i]!;
		const next: DeclarationNode = {};
		current[part] = next;
		current = next;
	}
	const lastPart = keyParts[keyParts.length - 1]!;
	current[lastPart] = {value};

	return {
		declaration: result,
		__meta: {name: keyParts[0]!, ...valueMeta},
	};
}
