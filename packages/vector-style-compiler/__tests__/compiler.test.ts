import {expect, it} from "vitest";

import cssToRules from "../src/js/cssToRules.ts";
import Replacer from "../src/js/helpers/Replacer.ts";
import compile from "../src/js/index.ts";
import rulesToTree, {type Tree} from "../src/js/rulesToTree.ts";
import treeToProgram from "../src/js/treeToProgram.ts";

// language=CSS
const testCss = `
	@import "will/be/ignored";

	@media (print) {
		/* will be ignored */
	}

	global-will-be-ignored: true

	;

	* {
		fillColor: #ff0000;
		attrTest: attr(test);
		attrPathTest: attr(path-to-test);
		envAttrTest: attr(--env-test);
		envAttrPathTest: attr(--env-path-to-test);
		calcTest: calc(33 * 200 + 45);
		replaceTest: replace("a", "e", "hallo");
		calcWithAttributesTest: calc(3 * attr(--env-path-to-test));
	}

	#testCircle {
		circle-stroke-width: 4;
		circle-fill-color: black;
	}

	:selected {
		stroke-color: orange;
	}

	:highlighted {
		stroke-color: green;
	}

	[state = "someState"] {
		fill-color: orange;
	}

	[state = "anotherState"] {
		fill-color: green;
	}

	#emptyStyle {
	}

	#features {
		icon-sizeX: 20;
		icon-sizeY: 20;
	}

	#features {
		/* this should extend the previous declaration */
		icon-sizeY: 30;
		icon-sizeZ: 30;
	}

	.group {
		fillColor: #ff0000;
		testEmptyValue: ;
	}

	.emptyGroup {
	}

	[attr="test"] {
		fillColor: #ff0000;
	}

	:not( [attr   =  "test"]   ) {
		fillColor: #ffff00;
	}

	[hasAttrTest] {
		foo: bar;
	}

	[attr="123"] {
		fillColor: #ff0000;
	}

	[props|attr="456"] {
		fillColor: #00ff00;
	}

	:not( [props|attr= "456"]   ) {
		fillColor: #00ffff;
	}

	[props|parking-capacity="tests nested properites"] {
		fillColor: #0000ff;
	}

	[env|zoom="2"] {
		test: test;
	}

	:not( [env|zoom="2"]   ) {
		foo: bar;
	}

	[geometry|type="Point"],
	[geometry|type="LineString"] {
		strokeColor: orange;
	}

	[geometry|type="Polygon"] {
		strokeColor: orange;
	}

	[|js="23 > 42"] {
		lorem: "ipsum";
	}

	:not( [|js="23 > 42"]   ) {
		lorem: dolor;
	}

	#features .group [attr="test"] {
		foo: bar;
	}

	/* test three equal signs */
	[|js="env.zoom >= 1 && env.zoom <= 10"] {
		foo: bar;
	}

	.nullishValues {
		a: 0;
		b: "";
		c: 0px;
		d: 0cm;
		e: "0";
		f: " ";
		g: "0px";
		h: "0cm";
	}

	[geometry|type="LineString"] .start {
		geometry: firstSegmentStart;
	}

	[geometry|type="LineString"] .arrow {
		geometry: intermediateSegmentEnd;
	}

	[geometry|type="LineString"] .arrowLast {
		geometry: lastSegmentEnd;
	}

	:not([attr]) {
		fillColor: #ff4400;
	}
`;

const exampleTree: Tree = {
	myStyleName: {
		myStateName: {
			children: [
				{
					conditions: [
						[
							{
								type: "value",
								target: "props",
								path: ["state"],
								value: "selected",
								negate: false,
							},
						],
					],
					declarations: {
						default: {
							fill: {
								color: {
									value: "'orange'",
								},
							},
						},
						other: {
							fill: {
								color: {
									value: "#00f",
								},
							},
						},
					},
				},
				{
					conditions: [
						[
							{
								type: "geometryType",
								value: "'LineString'",
								negate: false,
							},
						],
					],
				},
			],
		},
	},
};

it("creates replacer instance", () => {
	expect(() => new Replacer()).not.toThrow();
});

it("transforms tree to hash program", () => {
	const program = treeToProgram(exampleTree, "hash");
	expect(program).toMatchSnapshot();
});

it("transforms tree to declaration program", () => {
	const program = treeToProgram(exampleTree);
	expect(program).toMatchSnapshot();
});

it("transforms tree to volatile hash NOP program", () => {
	const program = treeToProgram(exampleTree, "volatileHash");

	expect(program).not.toContain("parts.push");
});

it("throws exception on invalid :not() selector", () => {
	expect(() => cssToRules(":not(*) {}")).toThrowError(
		"Cannot negate selector part [*] with :not().",
	);
	expect(() => cssToRules(":not(.group) {}")).toThrowError(
		"Cannot negate selector part [.group] with :not().",
	);
	expect(() => cssToRules(":not(#style) {}")).toThrowError(
		"Cannot negate selector part [#style] with :not().",
	);
});

it("parses nested declaration blocks as property paths", () => {
	const rules = cssToRules(`
		.clusterLabel {
			text {
				stroke {
					color: "red";
				}
			}
		}
	`);

	expect(rules.rules[0]?.declarations).toEqual({
		clusterLabel: {
			text: {
				stroke: {
					color: {value: "'red'"},
				},
			},
		},
	});
	expect(rules.__meta.declarationNames).toEqual(["text"]);
});

it("parses full css to rules correctly", () => {
	const rules = cssToRules(testCss);
	expect(rules).toMatchSnapshot();
});

it("parses full css to tree correctly", () => {
	const rules = cssToRules(testCss);
	const tree = rulesToTree(rules.rules);
	expect(tree).toMatchSnapshot();
});

it("parses and transforms full css to hash program correctly", () => {
	const rules = cssToRules(testCss);
	const tree = rulesToTree(rules.rules);

	const program = treeToProgram(tree, "hash");

	expect(program).toMatchSnapshot();
});

it("parses and transforms full css to declaration program correctly", () => {
	const rules = cssToRules(testCss);
	const tree = rulesToTree(rules.rules);

	const program = treeToProgram(tree);

	expect(program).toMatchSnapshot();
});

it("parses and template full css correctly", () => {
	const program = compile(testCss);
	expect(program).toMatchSnapshot();
});

it("parses and template empty css correctly", () => {
	const program = compile("");
	expect(program).toMatchSnapshot();
});
