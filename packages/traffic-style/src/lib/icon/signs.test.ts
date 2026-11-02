import {readFile} from "node:fs/promises";

import sharp from "sharp";
import {describe, expect, it} from "vitest";

import {signGlyphs} from "../../generated/sign-artwork.ts";
import meta from "../../meta.json" with {type: "json"};
import {mapsightRuntimeIconSize} from "../runtime/icon-size.ts";
import {composeSvg} from "./compose.ts";
import {
	type IconVariant,
	parseMapsightIcon,
	resolveMapsightIconSpec,
} from "./icon-id.ts";
import {applySignColors, combineArtwork} from "./signs/definition.ts";
import {uiIconSrc} from "./ui-icon-src.ts";

const variants: IconVariant[] = ["default", "small", "xsmall", "plain"];
const icons: Record<
	string,
	{render: string; groups?: string[]; fallback?: string}
> = meta.icons;
const signIds = Object.entries(icons)
	.filter(
		([, icon]) =>
			icon.render === "sprite" &&
			icon.groups?.some(
				(group) => group === "traffic" || group === "poi-parking",
			),
	)
	.map(([id]) => id);

async function rasterize(svg: string, scale = 1) {
	return sharp(Buffer.from(svg), {density: 72 * scale})
		.ensureAlpha()
		.raw()
		.toBuffer();
}

describe("traditional signs", () => {
	it("keeps a shared optical artboard for every glyph of a size, rather than cropping to ink", () => {
		for (const glyph of Object.values(signGlyphs)) {
			for (const [variant, size] of Object.entries({
				default: 24,
				small: 16,
				xsmall: 12,
				plain: 24,
			})) {
				expect(glyph[variant as IconVariant]).toMatchObject({
					viewBox: `0 0 ${size} ${size}`,
					width: size,
					height: size,
				});
			}
		}
	});
	it("places the same padded glyph at exact coordinates using composition metadata", async () => {
		const svg = {
			viewBox: "0 0 4 4",
			width: 4,
			height: 4,
			markup: '<rect x="1" y="1" width="2" height="2" fill="#000"/>',
		};
		const baseSvg = {
			...svg,
			markup: '<rect width="8" height="8" fill="#fff"/>',
		};
		const glyph = {default: svg, small: svg, xsmall: svg, plain: svg};
		const base = {
			default: baseSvg,
			small: baseSvg,
			xsmall: baseSvg,
			plain: baseSvg,
		};
		const at = (x: number, y: number) => ({
			default: {x, y, width: 4, height: 4},
			small: {x, y, width: 4, height: 4},
			xsmall: {x, y, width: 4, height: 4},
			plain: {x, y, width: 4, height: 4},
		});
		const draw = async (x: number, y: number) =>
			rasterize(
				`<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8">${combineArtwork(base, glyph, at(x, y)).default}</svg>`,
			);
		const first = await draw(1, 1);
		const second = await draw(2, 3);
		const pixel = (data: Buffer, x: number, y: number) => [
			...data.subarray((y * 8 + x) * 4, (y * 8 + x) * 4 + 4),
		];
		expect(pixel(first, 2, 2)).toEqual([0, 0, 0, 255]);
		expect(pixel(second, 2, 2)).toEqual([255, 255, 255, 255]);
		expect(pixel(second, 3, 4)).toEqual([0, 0, 0, 255]);
	});
	it("uses explicit paint bindings instead of inferring roles from matching colors", () => {
		const markup =
			'<path data-sign-fill="foreground" fill="#fff"/><path fill="#fff"/><path stroke="#fff" data-sign-stroke="border"/>';
		expect(
			applySignColors(markup, {foreground: "#123456", border: "#987654"}),
		).toBe(
			'<path fill="#123456"/><path fill="#fff"/><path stroke="#987654"/>',
		);
	});
	it("keeps literal asset defaults for omitted paint overrides", () => {
		expect(
			applySignColors(
				'<path fill="#b80707" data-sign-fill="background"/>',
				{},
			),
		).toBe('<path fill="#b80707"/>');
	});

	it.each([
		["default", 40],
		["small", 28],
		["xsmall", 22],
		["plain", 34],
	] as const)(
		"keeps sign UI and map geometry square in %s alongside wide POI icons",
		(variant, size) => {
			const id = "baustelle///#2266cc";
			expect(uiIconSrc(id, variant)).toMatchObject({
				width: size,
				height: size,
			});
			expect(mapsightRuntimeIconSize(id, variant, "width")).toBe(
				size * 2,
			);
			expect(mapsightRuntimeIconSize(id, variant, "height")).toBe(
				size * 2,
			);
		},
	);
	it.each(signIds)(
		"preserves every original %s variant, including parking fallbacks",
		async (id) => {
			for (const variant of variants) {
				let sourceId = id;
				let source: string;
				while (true) {
					try {
						source = await readFile(
							new URL(
								`../../icons/${sourceId}-${variant}.svg`,
								import.meta.url,
							),
							"utf8",
						);
						break;
					} catch (error) {
						const fallback = icons[sourceId]?.fallback;
						if (!fallback) throw error;
						sourceId = fallback;
					}
				}
				const spec = resolveMapsightIconSpec(id, variant)!;
				expect(spec.pictogram).toBe(id);
				for (const scale of [1, 2]) {
					expect(
						await rasterize(composeSvg(spec), scale),
						`${id}-${variant}@${scale}x`,
					).toEqual(await rasterize(source, scale));
				}
			}
		},
	);

	it("changes the background, symbol and border independently without tinting visibility outlines", async () => {
		const original = await rasterize(
			composeSvg({pictogram: "lkwsperrung"}),
		);
		const background = await rasterize(
			composeSvg({
				pictogram: "lkwsperrung",
				colors: {background: "#abcdef"},
			}),
		);
		const foreground = await rasterize(
			composeSvg({
				pictogram: "lkwsperrung",
				colors: {foreground: "#123456"},
			}),
		);
		const border = await rasterize(
			composeSvg({pictogram: "lkwsperrung", colors: {border: "#987654"}}),
		);
		const pixel = (image: Buffer, x: number, y: number) => [
			...image.subarray((y * 40 + x) * 4, (y * 40 + x) * 4 + 4),
		];
		expect(pixel(original, 20, 11)).toEqual([184, 7, 7, 255]);
		expect(pixel(border, 20, 11)).toEqual([152, 118, 84, 255]);
		expect(pixel(background, 20, 11)).toEqual(pixel(original, 20, 11));
		expect(pixel(foreground, 20, 11)).toEqual(pixel(original, 20, 11));
		expect(pixel(background, 20, 14)).toEqual([171, 205, 239, 255]);
		expect(pixel(foreground, 20, 14)).toEqual(pixel(original, 20, 14));
		expect(pixel(border, 20, 14)).toEqual(pixel(original, 20, 14));
		expect(pixel(original, 20, 18)).toEqual([0, 0, 0, 255]);
		expect(pixel(foreground, 20, 18)).toEqual([18, 52, 86, 255]);
		expect(pixel(background, 20, 18)).toEqual(pixel(original, 20, 18));
		expect(pixel(border, 20, 18)).toEqual(pixel(original, 20, 18));
		// White halo between sign band and outer black outline.
		expect(pixel(background, 20, 9)).toEqual(pixel(original, 20, 9));
	});

	it("keeps the traffic-light colors when overriding the sign", () => {
		for (const variant of variants) {
			const svg = composeSvg({
				pictogram: "ampel",
				variant,
				colors: {
					background: "#abcdef",
					foreground: "#123456",
					border: "#987654",
				},
			});
			for (const lamp of ["#3aaa35", "#f39200", "#d92400"]) {
				expect(svg).toContain(`fill="${lamp}"`);
			}
			expect(svg).toContain('fill="#abcdef"');
			expect(svg).toContain('stroke="#987654"');
		}
	});

	it("supports a base-only closure and colored parking symbols through the UI entry point", () => {
		for (const id of [
			"vollsperrung//#123456/#987654",
			"parkflaeche/#abcdef/#123456",
			"behindertenparken/#abcdef/#123456",
		]) {
			const icon = uiIconSrc(id)!;
			const svg = decodeURIComponent(icon.src.split(",")[1]!);
			expect(svg).toBe(
				composeSvg({...parseMapsightIcon(id)!, variant: "plain"}),
			);
			expect(svg).not.toContain("scale(");
			if (id.startsWith("vollsperrung/")) {
				expect(svg).toContain('stroke="#987654"');
				expect(svg).not.toContain("#123456");
			} else {
				expect(svg).toContain('fill="#abcdef"');
				expect(svg).toContain('fill="#123456"');
			}
		}
	});
});
