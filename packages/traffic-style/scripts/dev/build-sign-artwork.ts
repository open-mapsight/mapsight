#!/usr/bin/env node
import assert from "node:assert/strict";
import {mkdir, readFile, readdir, writeFile} from "node:fs/promises";

const sourceRoot = new URL("../../src/signs/", import.meta.url);
const output = new URL("../../src/generated/sign-artwork.ts", import.meta.url);
const sizes = {default: 40, small: 28, xsmall: 22, plain: 34};
const glyphSizes = {default: 24, small: 16, xsmall: 12, plain: 24};

/** Package authored SVGs verbatim; paint roles and default colors belong to the assets. */
async function readArtwork(kind: string) {
	const result: Record<
		string,
		Record<
			string,
			{viewBox: string; width: number; height: number; markup: string}
		>
	> = {};
	const directory = new URL(`${kind}/`, sourceRoot);
	for (const id of (await readdir(directory)).sort()) {
		const folder = new URL(`${id}/`, directory);
		assert.deepEqual(
			(await readdir(folder)).sort(),
			Object.keys(sizes)
				.map((variant) => `${variant}.svg`)
				.sort(),
			`Expected four authored variants: ${kind}/${id}`,
		);
		const variants: Record<
			string,
			{viewBox: string; width: number; height: number; markup: string}
		> = {};
		for (const [variant, size] of Object.entries(
			kind === "glyphs" ? glyphSizes : sizes,
		)) {
			const svg = await readFile(
				new URL(`${variant}.svg`, folder),
				"utf8",
			);
			const match = svg.match(/^<svg\b([^>]*)>([\s\S]*)<\/svg>\s*$/);
			assert(match, `Expected standalone SVG: ${kind}/${id}/${variant}`);
			assert(match[1]!.includes(`viewBox="0 0 ${size} ${size}"`));
			assert(match[1]!.includes(`width="${size}" height="${size}"`));
			assert(match[1]!.includes('fill="none" fill-rule="evenodd"'));
			const markup = match[2]!.trim().replace(/>\s+</g, "><");
			for (const tag of markup.match(/<[^>]+>/g) ?? []) {
				for (const binding of tag.matchAll(
					/data-sign-([\w-]+)="([^"]*)"/g,
				)) {
					assert(["fill", "stroke"].includes(binding[1]!));
					assert(
						["background", "foreground", "border"].includes(
							binding[2]!,
						),
					);
					assert(
						new RegExp(`\\s${binding[1]}="[^"]+"`).test(tag),
						"Paint binding needs an explicit default",
					);
				}
			}
			variants[variant] = {
				viewBox: `0 0 ${size} ${size}`,
				width: size,
				height: size,
				markup,
			};
		}
		result[id] = variants;
	}
	return result;
}

const bases = await readArtwork("bases");
const glyphs = await readArtwork("glyphs");
const metadata = JSON.parse(
	await readFile(new URL("compositions.json", sourceRoot), "utf8"),
) as {
	placements: Record<
		string,
		Record<string, {x: number; y: number; width: number; height: number}>
	>;
	icons: Record<string, {base: string; glyph?: string; placement?: string}>;
};
for (const [name, placement] of Object.entries(metadata.placements)) {
	assert.deepEqual(
		Object.keys(placement).sort(),
		Object.keys(sizes).sort(),
		`Incomplete placement: ${name}`,
	);
	for (const rect of Object.values(placement)) {
		assert(
			[rect.x, rect.y, rect.width, rect.height].every(Number.isFinite),
			`Non-finite placement: ${name}`,
		);
		assert(
			rect.width > 0 && rect.height > 0,
			`Non-positive placement: ${name}`,
		);
	}
}
for (const [id, composition] of Object.entries(metadata.icons)) {
	assert(Object.hasOwn(bases, composition.base), `Unknown base: ${id}`);
	if (composition.glyph) {
		assert(
			Object.hasOwn(glyphs, composition.glyph),
			`Unknown glyph: ${id}`,
		);
		assert(
			composition.placement &&
				Object.hasOwn(metadata.placements, composition.placement),
			`Missing placement: ${id}`,
		);
	} else {
		assert(!composition.placement, `Placement without glyph: ${id}`);
	}
}
await mkdir(new URL(".", output), {recursive: true});
await writeFile(
	output,
	[
		'import type {SignAsset} from "../lib/icon/signs/definition.ts";',
		"",
		"// Build output from src/signs; edit the standalone SVG assets.",
		`export const signBases = ${JSON.stringify(bases, null, "\t")} satisfies Record<string, SignAsset>;`,
		`export const signGlyphs = ${JSON.stringify(glyphs, null, "\t")} satisfies Record<string, SignAsset>;`,
		"",
	].join("\n"),
);
