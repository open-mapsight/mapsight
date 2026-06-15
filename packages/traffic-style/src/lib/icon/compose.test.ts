import {readFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";

import sharp from "sharp";
import {describe, expect, it} from "vitest";

import "../pictograms/fontawesome.ts";
import "../pictograms/index.ts";

import {composeSvg} from "./compose.ts";
import {prepareSvgForRasterization} from "./rasterize.ts";
import {resolveSpec} from "./resolve.ts";

type RasterImage = {
	data: Buffer;
	info: sharp.OutputInfo & {width: number; height: number; channels: number};
};

async function rasterizeImage(input: Buffer | string): Promise<RasterImage> {
	const image = await sharp(
		typeof input === "string" ? Buffer.from(input) : input,
	)
		.raw()
		.toBuffer({resolveWithObject: true});

	if (
		typeof image.info.width !== "number" ||
		typeof image.info.height !== "number" ||
		typeof image.info.channels !== "number"
	) {
		throw new Error("Rasterized image is missing dimensions or channels.");
	}

	return image as RasterImage;
}

function byteAt(buffer: Buffer, index: number): number {
	return buffer[index] ?? 0;
}

function changedPixelStats(
	actual: Buffer,
	expected: Buffer,
): {pixels: number; totalDelta: number} {
	let pixels = 0;
	let totalDelta = 0;

	for (let index = 0; index < expected.length; index += 4) {
		const delta =
			Math.abs(byteAt(actual, index) - byteAt(expected, index)) +
			Math.abs(byteAt(actual, index + 1) - byteAt(expected, index + 1)) +
			Math.abs(byteAt(actual, index + 2) - byteAt(expected, index + 2)) +
			Math.abs(byteAt(actual, index + 3) - byteAt(expected, index + 3));

		if (delta > 0) {
			pixels += 1;
			totalDelta += delta;
		}
	}

	return {pixels, totalDelta};
}

function nonTransparentBounds(image: RasterImage): {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
} {
	const {width, height, channels} = image.info;
	const bounds = {
		minX: Number.POSITIVE_INFINITY,
		minY: Number.POSITIVE_INFINITY,
		maxX: -1,
		maxY: -1,
	};

	for (let y = 0; y < height; y += 1) {
		for (let x = 0; x < width; x += 1) {
			const alpha = byteAt(image.data, (y * width + x) * channels + 3);
			if (alpha > 0) {
				bounds.minX = Math.min(bounds.minX, x);
				bounds.minY = Math.min(bounds.minY, y);
				bounds.maxX = Math.max(bounds.maxX, x);
				bounds.maxY = Math.max(bounds.maxY, y);
			}
		}
	}

	return bounds;
}

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

	it("recreates the legacy 2x default bike bitmap geometry", async () => {
		const fixtureUrl = new URL(
			"__fixtures__/bike-default@2x.png",
			import.meta.url,
		);
		const original = await readFile(fileURLToPath(fixtureUrl));
		const composed = composeSvg({
			pictogram: "bike",
			variant: "default",
			colors: {background: "#ffffff", foreground: "#000000"},
		});
		const originalRaster = await rasterizeImage(original);
		const composedRaster = await rasterizeImage(
			prepareSvgForRasterization(composed, 80, 80),
		);

		expect(composedRaster.info).toMatchObject({
			width: originalRaster.info.width,
			height: originalRaster.info.height,
			channels: originalRaster.info.channels,
		});
		expect(nonTransparentBounds(composedRaster)).toEqual(
			nonTransparentBounds(originalRaster),
		);

		// The published PNG does not exactly match the published SVG when both
		// are rasterized with the current sharp/libvips stack. Keep this tighter
		// than that known renderer drift while still catching geometry changes.
		expect(
			changedPixelStats(composedRaster.data, originalRaster.data),
		).toEqual({
			pixels: 485,
			totalDelta: 6_181,
		});
	});

	it("maps white pictogram details to the background color", () => {
		const svg = composeSvg({
			pictogram: "abfall_recycling",
			variant: "default",
			colors: {background: "#be123c", foreground: "#ffffff"},
		});
		const pictogram = svg.split("<g transform")[1] ?? "";

		expect(pictogram).toContain('fill="#be123c"');
		expect(pictogram).not.toContain('fill="#ffffff"');
	});

	it("keeps the white default background on the legacy footprint", () => {
		const svg = composeSvg({pictogram: "museum", variant: "default"});
		const background = svg.split("<g transform")[0] ?? svg;

		expect(background).toContain(
			'<rect x="7" y="7" width="26" height="26" rx="4" fill="#000000"/>',
		);
		expect(background).toContain(
			'<rect x="8" y="8" width="24" height="24" rx="3" fill="#ffffff"/>',
		);
		expect(background).not.toContain('stroke="#ffffff"');
	});

	it("keeps colored default backgrounds on the legacy footprint", () => {
		const svg = composeSvg({
			pictogram: "museum",
			variant: "default",
			colors: {background: "#035799", foreground: "#f8f8f8"},
		});
		const background = svg.split("<g transform")[0] ?? svg;

		expect(background).toContain(
			'<rect x="7" y="7" width="26" height="26" rx="4" fill="#000000"/>',
		);
		expect(background).toContain(
			'<rect x="8" y="8" width="24" height="24" rx="3" fill="#035799"/>',
		);
		expect(background).not.toContain('fill="#ffffff"');
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
