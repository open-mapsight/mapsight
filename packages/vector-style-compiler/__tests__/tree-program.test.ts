import {describe, expect, it} from "vitest";

import cssToRules from "../src/js/cssToRules.ts";
import rulesToTree from "../src/js/rulesToTree.ts";
import treeToProgram from "../src/js/treeToProgram.ts";

type Declaration = Record<string, {value?: unknown} | undefined>;

type ProgramInput = {
	env?: Record<string, unknown>;
	geometryType?: string;
	props?: Record<string, unknown>;
	state?: string;
	style?: string;
};

function compileDeclarationFunction(css: string) {
	const rules = cssToRules(css);
	const tree = rulesToTree(rules.rules);
	const program = treeToProgram(tree);
	// The compiler emits a program body; evaluate it the same way production
	// style runtimes do (new Function over the generated source).
	// eslint-disable-next-line @typescript-eslint/no-implied-eval -- intentional eval of compile output
	const execute = new Function(
		"env",
		"props",
		"geometryType",
		"style",
		"state",
		"get",
		`const d = {};${program};return d;`,
	) as (
		env: Record<string, unknown>,
		props: Record<string, unknown>,
		geometryType: string,
		style: string,
		state: string,
		get: (value: unknown, path: string[]) => unknown,
	) => Record<string, Declaration | undefined>;

	return ({
		env = {},
		geometryType = "Point",
		props = {},
		state = "default",
		style = "default",
	}: ProgramInput = {}) => {
		const getProp = (value: unknown, path: string[]): unknown =>
			path.reduce<unknown>((current, key) => {
				if (current && typeof current === "object") {
					return (current as Record<string, unknown>)[key];
				}
				return undefined;
			}, value);
		const result = execute(env, props, geometryType, style, state, getProp);
		// Declarations are nested under the CSS group (default when no .group).
		return result.default ?? {};
	};
}

describe("rulesToTree and treeToProgram", () => {
	it("applies default, state, style, and style-state declarations in precedence order", () => {
		// Style and state must be separate tokens (`#roads :selected`), not
		// `#roads:selected` which tokenizeSelector treats as one #id.
		const declaration = compileDeclarationFunction(`
			* { color: "default"; }
			:selected { color: "state"; }
			#roads { color: "style"; }
			#roads :selected { color: "style-state"; }
		`);

		expect(declaration().color?.value).toBe("default");
		expect(declaration({state: "selected"}).color?.value).toBe("state");
		expect(declaration({style: "roads"}).color?.value).toBe("style");
		expect(
			declaration({style: "roads", state: "selected"}).color?.value,
		).toBe("style-state");
	});

	it("evaluates AND checks within selectors and OR checks across selectors", () => {
		const declaration = compileDeclarationFunction(`
			[kind="road"][active],
			[kind="path"][active] {
				match: true;
			}
		`);

		expect(
			declaration({props: {kind: "road", active: true}}).match?.value,
		).toBe("true");
		expect(
			declaration({props: {kind: "path", active: true}}).match?.value,
		).toBe("true");
		expect(
			declaration({props: {kind: "road", active: false}}).match,
		).toBeUndefined();
		expect(
			declaration({props: {kind: "other", active: true}}).match,
		).toBeUndefined();
	});

	it("negates selector checks", () => {
		const declaration = compileDeclarationFunction(`
			:not([disabled]) { enabled: true; }
		`);

		expect(declaration({props: {disabled: false}}).enabled?.value).toBe(
			"true",
		);
		expect(declaration({props: {disabled: true}}).enabled).toBeUndefined();
	});

	it("reuses aliases for repeated property reads", () => {
		const declaration = compileDeclarationFunction(`
			[kind="road"],
			[kind="path"] {
				match: true;
			}
		`);
		let reads = 0;
		const props = new Proxy(
			{kind: "path"},
			{
				get(target, property, receiver) {
					if (property === "kind") {
						reads += 1;
					}
					return Reflect.get(target, property, receiver);
				},
			},
		);

		expect(declaration({props}).match?.value).toBe("true");
		expect(reads).toBe(1);
	});

	it("keeps alias bindings independent across style and state cases", () => {
		const declaration = compileDeclarationFunction(`
			#roads [kind="road"] { match: "roads"; }
			#water [kind="water"] { match: "water"; }
			:selected [kind="selected"] { match: "selected"; }
			:highlighted [kind="highlighted"] { match: "highlighted"; }
		`);

		expect(
			declaration({style: "roads", props: {kind: "road"}}).match?.value,
		).toBe("roads");
		expect(
			declaration({style: "water", props: {kind: "water"}}).match?.value,
		).toBe("water");
		expect(
			declaration({state: "selected", props: {kind: "selected"}}).match
				?.value,
		).toBe("selected");
		expect(
			declaration({
				state: "highlighted",
				props: {kind: "highlighted"},
			}).match?.value,
		).toBe("highlighted");
	});
});
