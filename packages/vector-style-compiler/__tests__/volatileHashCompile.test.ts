import {expect, it} from "vitest";

import cssToRules from "../src/js/cssToRules.ts";
import compile from "../src/js/index.ts";
import rulesToTree from "../src/js/rulesToTree.ts";
import treeToProgram from "../src/js/treeToProgram.ts";

const runtimeIconCss = `
#features [mapsightIconId] {
  icon-src: calc(mapsightRuntimeIcon(attr(mapsightIconId), "default"));
}
`;

const spriteOnlyCss = `
#features {
  icon-src: /sprite.png;
}
`;

it("always emits volatileHashFunction in compiled output", () => {
	const js = compile(spriteOnlyCss);

	expect(js).toContain("volatileHashFunction:");
	expect(js).toContain("const parts = [];");
	expect(js).toContain("return createHash(parts);");
});

it("leaves volatile hash body empty when stylesheet has no volatile calcs", () => {
	const js = compile(spriteOnlyCss);
	const volatileBlock =
		js.match(
			/volatileHashFunction: \(env, props, geometryType, style\) => \{[\s\S]*?return createHash\(parts\);\n\t\},/,
		)?.[0] ?? "";

	expect(volatileBlock).toContain("return createHash(parts);");
	expect(volatileBlock).not.toContain("parts.push(String(");
	expect(volatileBlock).not.toContain("switch (style)");
	expect(js).not.toContain("mapsightRuntimeIcon");
});

it("emits volatile hash body for runtime icon calcs", () => {
	const js = compile(runtimeIconCss);

	expect(js).toContain(
		"parts.push(String(mapsightRuntimeIcon(props['mapsightIconId'], \"default\")))",
	);
});

it("transforms tree to volatile hash NOP program", () => {
	const tree = rulesToTree(cssToRules(spriteOnlyCss).rules);

	expect(treeToProgram(tree, "volatileHash")).not.toContain("parts.push");
});

it("transforms tree to volatile hash program", () => {
	const tree = rulesToTree(cssToRules(runtimeIconCss).rules);

	expect(treeToProgram(tree, "volatileHash")).toMatchSnapshot();
});
