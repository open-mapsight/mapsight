import {describe, expect, it} from "vitest";

import "../pictograms/fontawesome.ts";

import {composeSvg} from "./compose.ts";
import {resolveSpec} from "./resolve.ts";

describe("composeSvg", () => {
	it("scales and centers pictograms in the content slot", () => {
		const svg = composeSvg({pictogram: "museum", variant: "default"});
		expect(svg).toMatch(/scale\([\d.]+\) translate\(/);
	});

	it("composes a default poi pictogram icon", () => {
		const svg = composeSvg({pictogram: "museum", variant: "default"});
		expect(svg).toContain('viewBox="0 0 40 40"');
		expect(svg).toContain('fill="#ffffff"');
		expect(svg).toContain("currentColor");
	});

	it("adds a white inner outline for all backgrounds", () => {
		for (const colors of [
			{background: "#035799", foreground: "#f8f8f8"},
			undefined,
		]) {
			const svg = composeSvg({
				pictogram: "museum",
				variant: "default",
				colors,
			});
			const background = svg.split("<g transform")[0] ?? svg;
			expect(background).toContain('stroke="#000000"');
			expect(background).toContain('stroke="#ffffff"');
		}
	});

	it("composes a letter icon without pictogram", () => {
		const svg = composeSvg({label: "ab", variant: "small"});
		expect(svg).toContain(">AB<");
		expect(svg).toContain('viewBox="0 0 28 28"');
	});

	it("prefers pictogram over label", () => {
		const svg = composeSvg({
			pictogram: "fa-school",
			label: "GS",
			variant: "default",
		});
		expect(svg).toContain("currentColor");
		expect(svg).not.toContain(">GS<");
	});

	it("defaults label-only specs to the default variant", () => {
		expect(resolveSpec({label: "A"}).variant).toBe("default");
	});
});
