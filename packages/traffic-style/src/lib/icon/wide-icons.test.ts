import {describe, expect, it} from "vitest";

import {
	getPictogram,
	hasPictogram,
	registerPictograms,
} from "../pictograms/index.ts";
import {composeSvg} from "./compose.ts";
import {
	type IconVariant,
	parseMapsightIcon,
	resolveMapsightIconSpec,
} from "./icon-id.ts";
import {uiIconSrc} from "./ui-icon-src.ts";

const variants = [
	["default", 64, 40, 24],
	["small", 41, 28, 13],
	["xsmall", 31, 22, 9],
	["plain", 54, 34, 20],
] as const;

describe("horizontal catalog icons", () => {
	it("includes both standard toilet catalog definitions", () => {
		expect(hasPictogram("toilet")).toBe(true);
		expect(hasPictogram("toilet-accessible")).toBe(true);
		expect(
			getPictogram("toilet-accessible").composition?.glyphs,
		).toHaveLength(2);
	});

	it.each(variants)(
		"keeps full glyph sizes and a shared frame in %s",
		(variant, width, height, step) => {
			const colors = {background: "#f2c14e", foreground: "#0e2a4f"};
			const svg = composeSvg({
				pictogram: "toilet-accessible",
				variant,
				colors,
			});
			const single = composeSvg({pictogram: "toilet", variant, colors});
			const glyphs = [
				...svg.matchAll(
					/<g transform="translate\(([^ ]+) ([^)]+)\) scale\(([^)]+)\)/g,
				),
			];
			const singleGlyph = [
				...single.matchAll(
					/<g transform="translate\(([^ ]+) ([^)]+)\) scale\(([^)]+)\)/g,
				),
			][0];
			expect(glyphs).toHaveLength(2);
			expect(glyphs[0]?.slice(1)).toEqual(singleGlyph?.slice(1));
			expect(svg).toContain(`viewBox="0 0 ${width} ${height}"`);
			expect(svg.match(/<rect /g)).toHaveLength(
				variant === "default" ? 2 : 1,
			);
			expect(svg.match(/color="#0e2a4f"/g)).toHaveLength(2);
			expect(svg).toContain('fill="#f2c14e"');
			const icon = uiIconSrc(
				"toilet-accessible/#f2c14e/#0e2a4f",
				variant,
			);
			expect(icon).toMatchObject({width, height});
			const wheelchair =
				getPictogram("toilet-accessible").composition?.glyphs[1];
			if (!wheelchair) throw new Error("Missing wheelchair glyph");
			registerPictograms([{id: "test-wheelchair", ...wheelchair}]);
			const singleWheelchair = composeSvg({
				pictogram: "test-wheelchair",
				variant,
				colors,
			});
			const wheelTransform = [
				...singleWheelchair.matchAll(
					/<g transform="translate\(([^ ]+) ([^)]+)\) scale\(([^)]+)\)/g,
				),
			][0];
			expect(glyphs[1]?.slice(2)).toEqual(wheelTransform?.slice(2));
			expect(
				Number(glyphs[1]?.[1]) - Number(wheelTransform?.[1]),
			).toBeCloseTo(step);
		},
	);

	it("matches the compact reference frame", () => {
		const svg = composeSvg({pictogram: "toilet-accessible"});
		expect(svg).toContain(
			'<rect x="7" y="7" width="50" height="26" rx="4"',
		);
		expect(svg).toContain(
			'<rect x="8" y="8" width="48" height="24" rx="3"',
		);
	});

	it("supports a host composition through the same general layout", () => {
		const glyph = {
			viewBox: "0 0 24 24",
			markup: '<path fill="currentColor" d="M0 0h24v24H0z"/>',
			source: "traffic-style" as const,
		};
		registerPictograms([
			{
				id: "test-wide",
				source: "traffic-style",
				composition: {layout: "horizontal", glyphs: [glyph, glyph]},
			},
		]);
		const svg = composeSvg({pictogram: "test-wide"});
		expect(svg).toContain("translate(8 8) scale(1)");
		expect(svg).toContain("translate(32 8) scale(1)");
	});

	it("preserves case-insensitive compact text labels", () => {
		for (const label of ["WC", "wc", "Wc", "AB", "ab", "P2"]) {
			expect(parseMapsightIcon(`${label}/#f2c14e/#0e2a4f`)).toEqual({
				label: label.toUpperCase(),
				colors: {background: "#f2c14e", foreground: "#0e2a4f"},
			});
		}
		expect(parseMapsightIcon("toilet/#fff/#123")).toEqual({
			pictogram: "toilet",
			colors: {background: "#fff", foreground: "#123"},
		});
		expect(resolveMapsightIconSpec("toilet-accessible")?.pictogram).toBe(
			"toilet-accessible",
		);
	});

	it.each(["default", "small", "xsmall", "plain"] as IconVariant[])(
		"retains attribution in %s SVG",
		(variant) => {
			expect(
				composeSvg({pictogram: "toilet-accessible", variant}),
			).toContain("Font Awesome Free by Fonticons");
		},
	);
});
