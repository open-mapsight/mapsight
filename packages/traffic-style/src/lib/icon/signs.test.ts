import {readFile} from "node:fs/promises";

import sharp from "sharp";
import {describe, expect, it} from "vitest";

import meta from "../../meta.json" with {type: "json"};
import {composeSvg} from "./compose.ts";
import {
	type IconVariant,
	parseMapsightIcon,
	resolveMapsightIconSpec,
} from "./icon-id.ts";
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

async function rasterize(svg: string) {
	return sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer();
}

describe("traditional signs", () => {
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
				expect(
					await rasterize(composeSvg(spec)),
					`${id}-${variant}`,
				).toEqual(await rasterize(source));
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
			expect(svg).not.toContain('<g transform="translate(');
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
