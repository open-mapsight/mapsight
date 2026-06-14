import {expect, it} from "vitest";

import cssToRules from "../src/js/cssToRules.ts";
import compile from "../src/js/index.ts";
import rulesToTree from "../src/js/rulesToTree.ts";

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
