import {expect, it} from "vitest";

import cssToRules from "../src/js/cssToRules.ts";
import compile from "../src/js/index.ts";
import rulesToTree from "../src/js/rulesToTree.ts";
import treeToProgram from "../src/js/treeToProgram.ts";

type DeclarationLeaf = {value: unknown};
type DeclarationBlock = {
	[key: string]: DeclarationBlock | DeclarationLeaf;
};

function createDeclarationFunction(css: string) {
	const rules = cssToRules(css);
	const tree = rulesToTree(rules.rules);
	const program = treeToProgram(tree, "declaration", 1);

	// The compiler emits executable declaration JS; this test verifies its runtime behavior.
	// eslint-disable-next-line @typescript-eslint/no-implied-eval
	return new Function(
		"env",
		"props",
		"geometryType",
		"style",
		`const d = {};${program}
return d;`,
	) as (
		env: Record<string, unknown>,
		props: Record<string, unknown>,
		geometryType?: string,
		style?: string,
	) => DeclarationBlock;
}

function getIconOffsetX(declaration: DeclarationBlock) {
	const defaultGroup = declaration.default as DeclarationBlock;
	const icon = defaultGroup.icon as DeclarationBlock;
	const offsetX = icon.offsetX as DeclarationLeaf;

	return offsetX.value;
}

it("compiles runtime icon selectors to JS", () => {
	const css = `
#features {
  icon-src: /sprite.png;
}
#features [mapsightIconId] {
  icon-src: calc(mapsightRuntimeIcon(attr(mapsightIconId), "default"));
}
`;
	const rules = cssToRules(css);
	const tree = rulesToTree(rules.rules);
	expect(tree.features?.default?.children?.length).toBeGreaterThan(0);

	const js = compile(css);
	expect(js).toContain("mapsightRuntimeIcon");
	expect(js).toContain("props['mapsightIconId']");
	expect(js).toContain("volatileHashFunction");
	expect(js).toContain("return createHash(parts);");
	expect(js).toContain(
		"parts.push(String(mapsightRuntimeIcon(props['mapsightIconId'], \"default\")))",
	);
});

it("compiles env runtime icon selectors to JS", () => {
	const css = `
#features {
  icon-src: /sprite.png;
}
#features [env|mapsightIconId] {
  icon-src: calc(mapsightRuntimeIcon(attr(--env-mapsightIconId), "default"));
}
`;
	const js = compile(css);
	expect(js).toContain("mapsightRuntimeIcon");
	expect(js).toContain("env['mapsightIconId']");
	expect(js).toContain(
		"parts.push(String(mapsightRuntimeIcon(env['mapsightIconId'], \"default\")))",
	);
});

it("compiles force env runtime icon selectors to JS", () => {
	const css = `
#features {
  icon-src: /sprite.png;
}
#features [env|mapsightIconUse=force] [env|mapsightIconId] {
  icon-src: calc(mapsightRuntimeIcon(attr(--env-mapsightIconId), "default"));
}
`;
	const js = compile(css);
	expect(js).toContain("env['mapsightIconUse']");
	expect(js).toContain("env['mapsightIconId']");
	expect(js).toContain(
		"parts.push(String(mapsightRuntimeIcon(env['mapsightIconId'], \"default\")))",
	);
});

it("compiles sprite icon rules after runtime icon rules", () => {
	const css = `
#features {
  icon-src: /sprite.png;
}
#features [mapsightIconId] {
  icon-src: calc(mapsightRuntimeIcon(attr(mapsightIconId), "default"));
}
#features [mapsightIconId=ampel] {
  icon-src: /sprite.png;
  icon-offsetX: 10;
}
`;
	const js = compile(css);
	expect(js).toContain("mapsightRuntimeIcon");
	expect(js).toContain("== 'ampel'");
	expect(js).toMatch(/\/sprite\.png/);
});

it("keeps env icon selectors from overriding feature icons unless forced", () => {
	const styleFunction = createDeclarationFunction(`
#features [mapsightIconId="feature"] {
  icon-offsetX: 10;
}
#features :not([mapsightIconId]) [env|mapsightIconId="env"] {
  icon-offsetX: 20;
}
#features [env|mapsightIconUse="force"] [env|mapsightIconId="env"] {
  icon-offsetX: 30;
}
`);

	expect(
		getIconOffsetX(
			styleFunction(
				{mapsightIconId: "env"},
				{mapsightIconId: "feature"},
				"Point",
				"features",
			),
		),
	).toBe(10);
	expect(
		getIconOffsetX(
			styleFunction({mapsightIconId: "env"}, {}, "Point", "features"),
		),
	).toBe(20);
	expect(
		getIconOffsetX(
			styleFunction(
				{mapsightIconId: "env", mapsightIconUse: "force"},
				{mapsightIconId: "feature"},
				"Point",
				"features",
			),
		),
	).toBe(30);
});
