import * as sass from "sass";
import {describe, expect, it} from "vitest";

import cssToRules from "../src/js/cssToRules.ts";
import mapSelectorPart from "../src/js/cssToRules/mapSelectorPart.ts";
import mapValue from "../src/js/cssToRules/mapValue.ts";
import pathToExpression from "../src/js/helpers/pathToExpression.ts";
import compile from "../src/js/index.ts";
import rulesToTree from "../src/js/rulesToTree.ts";
import treeToProgram from "../src/js/treeToProgram.ts";

function compileScss(source: string): string {
	return sass
		.compileString(source, {
			style: "expanded",
			quietDeps: true,
			silenceDeprecations: ["legacy-js-api"],
		})
		.css.toString();
}

describe("Sass pre-processing", () => {
	it("preserves quoted attr() literal keys through Sass", () => {
		const css = compileScss(`
			#features {
				stroke-width: attr('stroke-width');
			}
		`);

		expect(css).toContain('attr("stroke-width")');

		const program = compile(css);
		expect(program).toContain("props['stroke-width']");
		expect(program).not.toContain("get(props, ['stroke', 'width'])");
	});

	it("preserves unquoted attr() nested paths through Sass", () => {
		const css = compileScss(`
			#features {
				stroke-width: attr(stroke-width);
			}
		`);

		expect(css).toContain("attr(stroke-width)");

		const program = compile(css);
		expect(program).toContain("get(props, ['stroke', 'width'])");
		expect(program).not.toContain("props['stroke-width']");
	});

	it("does not allow quoted attribute selector names in Sass source", () => {
		expect(() =>
			compileScss(`['stroke-width'="3"] { fill-color: red; }`),
		).toThrow();
	});

	it("treats interpolated selector names as unquoted nested paths", () => {
		const css = compileScss(`[#{"stroke-width"}="3"] { fill-color: red; }`);

		expect(css).toContain('[stroke-width="3"]');

		const program = treeToProgram(rulesToTree(cssToRules(css).rules));
		expect(program).toContain("get(props, ['stroke', 'width'])");
		expect(program).not.toContain("props['stroke-width']");
	});

	it("allows |js selectors through Sass when the expression has no ] characters", () => {
		const css = compileScss(`
			[|js="get(props, 'stroke-width') == 3"] {
				fill-color: red;
			}
		`);

		const program = treeToProgram(rulesToTree(cssToRules(css).rules));
		expect(program).toContain("get(props, 'stroke-width') == 3");
	});

	it("preserves bracket notation inside |js selectors through Sass", () => {
		const css = compileScss(`
			[|js="props['stroke-width'] == 3"] {
				fill-color: red;
			}
		`);

		const program = treeToProgram(rulesToTree(cssToRules(css).rules));
		expect(program).toContain("props['stroke-width'] == 3");
	});

	it("supports prop-prefixed attr() in Sass when the argument is quoted", () => {
		const css = compileScss(`
			#features {
				stroke-width: attr("prop|stroke-width");
				fill-color: attr("env-prop|primaryColor");
			}
		`);

		expect(css).toContain('attr("prop|stroke-width")');
		expect(css).toContain('attr("env-prop|primaryColor")');

		const program = compile(css);
		expect(program).toContain("props['stroke-width']");
		expect(program).toContain("env['primaryColor']");
		expect(program).toContain('allowedProps: ["stroke-width"]');
	});

	it("supports unquoted prop-prefixed attr() in plain CSS", () => {
		const program = compile(`
			#features {
				stroke-width: attr(prop|stroke-width);
			}
		`);

		expect(program).toContain("props['stroke-width']");
	});

	it("supports prop-prefixed selectors in Sass", () => {
		const css = compileScss(`
			#features {
				[prop|stroke-width] {
					stroke-width: attr('stroke-width');
				}
			}
		`);

		const rules = cssToRules(css);
		expect(rules.__meta.styleProps).toContain("stroke-width");
		expect(rules.__meta.stylePropExpressions).toContain(
			"props['stroke-width']",
		);

		const program = compile(css);
		expect(program).toContain("props['stroke-width']");
		expect(program).not.toContain("get(props, ['stroke', 'width'])");
	});

	it("supports env-prop-prefixed selectors in Sass", () => {
		expect(() =>
			compileScss(`[env|prop|stroke-width="3"] { fill-color: red; }`),
		).toThrow();

		const css = compileScss(`
			[env-prop|stroke-width="3"] {
				fill-color: red;
			}
		`);

		const program = treeToProgram(rulesToTree(cssToRules(css).rules));
		expect(program).toContain("env['stroke-width']");
		expect(program).toContain("== 3");
	});
});

describe("pathToExpression", () => {
	it("emits bracket access for single segments and get() for nested paths", () => {
		expect(pathToExpression("props", ["stroke-width"])).toBe(
			"props['stroke-width']",
		);
		expect(pathToExpression("props", ["stroke", "width"])).toBe(
			"get(props, ['stroke', 'width'])",
		);
	});
});

describe("attr() feature property paths", () => {
	it("maps unquoted kebab-case to nested props paths", () => {
		expect(mapValue("attr(stroke-width)")).toMatchObject({
			value: "'' + get(props, ['stroke', 'width']) + ''",
			__meta: {
				styleProps: ["stroke"],
				stylePropExpressions: ["get(props, ['stroke', 'width'])"],
			},
		});
	});

	it("maps quoted names to literal props keys", () => {
		expect(mapValue("attr('stroke-width')")).toMatchObject({
			value: "'' + props['stroke-width'] + ''",
			__meta: {
				styleProps: ["stroke-width"],
				stylePropExpressions: ["props['stroke-width']"],
			},
		});

		expect(mapValue('attr("stroke-width")')).toMatchObject({
			value: "'' + props['stroke-width'] + ''",
		});
	});

	it("maps prop-prefixed names to literal props and env keys", () => {
		expect(mapValue("attr(prop|stroke-width)")).toMatchObject({
			value: "'' + props['stroke-width'] + ''",
			__meta: {
				styleProps: ["stroke-width"],
				stylePropExpressions: ["props['stroke-width']"],
			},
		});

		expect(mapValue("attr(env-prop|stroke-width)")).toMatchObject({
			value: "'' + env['stroke-width'] + ''",
		});
	});

	it("maps unquoted env paths to nested env keys", () => {
		expect(mapValue("attr(--env-stroke-width)")).toMatchObject({
			value: "'' + get(env, ['stroke', 'width']) + ''",
		});
	});

	it("maps quoted env paths to literal env keys", () => {
		expect(mapValue("attr(--env-'stroke-width')")).toMatchObject({
			value: "'' + env['stroke-width'] + ''",
		});
	});
});

describe("[attribute] selector feature property paths", () => {
	it("maps unquoted kebab-case to nested props paths", () => {
		expect(mapSelectorPart("[stroke-width]")).toMatchObject({
			check: {
				type: "value",
				target: "props",
				path: ["stroke", "width"],
				negate: false,
			},
			__meta: {
				styleProps: ["stroke"],
				stylePropExpressions: ["get(props, ['stroke', 'width'])"],
			},
		});

		expect(mapSelectorPart('[stroke-width="3"]')).toMatchObject({
			check: {
				type: "value",
				target: "props",
				path: ["stroke", "width"],
				value: 3,
			},
			__meta: {
				stylePropExpressions: ["get(props, ['stroke', 'width'])"],
			},
		});
	});

	it("maps prop-prefixed names to literal props keys", () => {
		expect(mapSelectorPart("[prop|stroke-width]")).toMatchObject({
			check: {
				type: "value",
				target: "props",
				path: ["stroke-width"],
			},
			__meta: {
				styleProps: ["stroke-width"],
				stylePropExpressions: ["props['stroke-width']"],
			},
		});

		expect(mapSelectorPart('[prop|stroke-width="3"]')).toMatchObject({
			check: {
				type: "value",
				target: "props",
				path: ["stroke-width"],
				value: 3,
			},
			__meta: {
				styleProps: ["stroke-width"],
				stylePropExpressions: ["props['stroke-width']"],
			},
		});

		expect(mapSelectorPart('[env-prop|stroke-width="3"]')).toMatchObject({
			check: {
				type: "value",
				target: "env",
				path: ["stroke-width"],
				value: 3,
			},
			__meta: {
				styleProps: [],
				stylePropExpressions: [],
			},
		});
	});

	it("maps quoted names to literal props keys", () => {
		expect(mapSelectorPart("['stroke-width']")).toMatchObject({
			check: {
				type: "value",
				target: "props",
				path: ["stroke-width"],
			},
			__meta: {
				styleProps: ["stroke-width"],
				stylePropExpressions: ["props['stroke-width']"],
			},
		});

		expect(mapSelectorPart('[props|"stroke-width"="3"]')).toMatchObject({
			check: {
				type: "value",
				target: "props",
				path: ["stroke-width"],
				value: 3,
			},
		});
	});

	it("compiles nested vs literal selector checks differently", () => {
		const nested = treeToProgram(
			rulesToTree(
				cssToRules(`
					[stroke-width="3"] {
						fill-color: red;
					}
				`).rules,
			),
		);
		const literal = treeToProgram(
			rulesToTree(
				cssToRules(`
					['stroke-width'="3"] {
						fill-color: red;
					}
				`).rules,
			),
		);

		expect(nested).toContain("get(props, ['stroke', 'width'])");
		expect(nested).toContain("== 3");
		expect(literal).toContain("props['stroke-width']");
		expect(literal).toContain("== 3");
		expect(nested).not.toContain("props['stroke-width']");
		expect(literal).not.toContain("get(props, ['stroke', 'width'])");
	});

	it("includes selector paths in allowedProps metadata", () => {
		const rules = cssToRules(`
			[prop|stroke-width="3"] {
				fill-color: red;
			}
		`);

		expect(rules.__meta.styleProps).toEqual(["stroke-width"]);
		expect(rules.__meta.stylePropExpressions).toEqual([
			"props['stroke-width']",
		]);

		const program = compile(`
			[prop|stroke-width="3"] {
				fill-color: red;
			}
		`);
		expect(program).toContain('allowedProps: ["stroke-width"]');
	});
});

describe("CSS declaration property names vs feature props", () => {
	it("still maps stroke-width declarations to nested style object paths", () => {
		const rules = cssToRules(`
			#features {
				stroke-width: attr(stroke-width);
			}
		`);

		expect(rules.rules[0]?.declarations).toEqual({
			default: {
				stroke: {
					width: {
						value: "'' + get(props, ['stroke', 'width']) + ''",
					},
				},
			},
		});
	});

	it("can read a literal stroke-width feature prop into a style declaration", () => {
		const rules = cssToRules(`
			#features {
				stroke-width: attr('stroke-width');
			}
		`);

		expect(rules.rules[0]?.declarations).toEqual({
			default: {
				stroke: {
					width: {
						value: "'' + props['stroke-width'] + ''",
					},
				},
			},
		});
	});
});
