#!/usr/bin/env node
import assert from "node:assert/strict";
import {mkdir, readFile, readdir, writeFile} from "node:fs/promises";

const sourceRoot = new URL("../../src/signs/", import.meta.url);
const output = new URL("../../src/generated/sign-artwork.ts", import.meta.url);
const sizes = {default: 40, small: 28, xsmall: 22, plain: 34};

/** Package authored SVGs verbatim; paint roles and default colors belong to the assets. */
async function readArtwork(kind: string) {
	const result: Record<string, Record<string, string>> = {};
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
		const variants: Record<string, string> = {};
		for (const [variant, size] of Object.entries(sizes)) {
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
			variants[variant] = markup;
		}
		result[id] = variants;
	}
	return result;
}

const bases = await readArtwork("bases");
const glyphs = await readArtwork("glyphs");
await mkdir(new URL(".", output), {recursive: true});
await writeFile(
	output,
	[
		'import type {SignArtwork} from "../lib/icon/signs/definition.ts";',
		"",
		"// Build output from src/signs; edit the standalone SVG assets.",
		`export const signBases = ${JSON.stringify(bases, null, "\t")} satisfies Record<string, SignArtwork>;`,
		`export const signGlyphs = ${JSON.stringify(glyphs, null, "\t")} satisfies Record<string, SignArtwork>;`,
		"",
	].join("\n"),
);
