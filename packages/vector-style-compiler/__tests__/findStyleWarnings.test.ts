import {describe, expect, it} from "vitest";

import compile from "../src/js/index.ts";

function warningsOf(css: string) {
	const warnings: string[] = [];
	compile(css, {onWarning: (message) => warnings.push(message)});
	return warnings;
}

describe("image-type warning", () => {
	it("warns once per style naming the style and its properties", () => {
		const warnings = warningsOf(`
			#myStyle { circle-radius: 5; }
			#myStyle :selected { circle-fill-color: red; }
			#other { icon-src: "a.png"; icon-sizex: 8; }
		`);
		expect(warnings).toHaveLength(2);
		expect(warnings[0]).toContain('"myStyle"');
		expect(warnings[0]).toContain("circle-radius");
		expect(warnings[0]).toContain("circle-fill-color");
		expect(warnings[0]).toContain("image-type");
		expect(warnings[1]).toContain('"other"');
		expect(warnings[1]).toContain("icon-src, icon-sizex");
	});

	it("warns for style-less rules when no rule declares image-type", () => {
		expect(warningsOf("* { circle-radius: 5; }")).toHaveLength(1);
	});

	it("handles nested property blocks", () => {
		const [warning] = warningsOf("#s { circle { radius: 5; } }");
		expect(warning).toContain("circle-radius");
	});

	it("does not warn when the style declares image-type", () => {
		expect(
			warningsOf("#s { image-type: circle; circle-radius: 5; }"),
		).toEqual([]);
	});

	it("does not warn when image-type comes from a less specific selector of the style", () => {
		expect(
			warningsOf(`
				#s { image-type: circle; circle-radius: 5; }
				#s :selected { circle-radius: 8; }
				#s [kind="a"] { circle-fill-color: red; }
			`),
		).toEqual([]);
		expect(
			warningsOf(`
				#s :selected { circle-radius: 8; }
				#s { image-type: circle; }
			`),
		).toEqual([]);
	});

	it("does not warn when a global rule declares image-type", () => {
		expect(
			warningsOf(`
				* { image-type: circle; }
				#s { circle-radius: 5; }
				:selected { circle-fill-color: red; }
			`),
		).toEqual([]);
	});

	it("does not warn for style-less properties if any rule declares image-type", () => {
		expect(
			warningsOf(`
				* { circle-radius: 5; }
				#a { image-type: circle; }
			`),
		).toEqual([]);
	});

	it("does not warn when image-type applies through a selector list", () => {
		expect(
			warningsOf(`
				#a, #b { image-type: circle; }
				#b { circle-radius: 5; }
			`),
		).toEqual([]);
	});

	it("accepts image-type: none as an explicit value", () => {
		expect(
			warningsOf("#s { image-type: none; circle-radius: 5; }"),
		).toEqual([]);
	});

	it("analyzes style groups separately", () => {
		expect(
			warningsOf(`
				#s { image-type: circle; circle-radius: 5; }
				#s .second { circle-radius: 5; }
			`),
		).toHaveLength(1);
	});

	it("does not change the generated output", () => {
		const css = `
			#s { circle-radius: 5; }
			#t { image-type: circle; circle-radius: 5; }
		`;
		expect(compile(css, {onWarning: () => {}})).toBe(compile(css));
	});
});
