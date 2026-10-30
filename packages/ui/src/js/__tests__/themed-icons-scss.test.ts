// @vitest-environment node
import {existsSync, readFileSync, readdirSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {compileString} from "sass";
import {describe, expect, it} from "vitest";

const packageRoot = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"../../..",
);
const scssRoot = path.join(packageRoot, "src/scss");
const iconRoot = path.join(packageRoot, "src/img/mapsight-ui");
const attributionRoot = path.join(packageRoot, "src/img/attribution");
const attributionFiles = new Set([
	"built-with-mapsight-de-120x40-light.svg",
	"built-with-mapsight-en-120x40-light.svg",
	"built-with-mapsight-de-90x30-light.svg",
	"built-with-mapsight-en-90x30-light.svg",
]);

function compile(themedIcons?: boolean) {
	const flag =
		themedIcons === undefined
			? ""
			: `,\n\t$ms3-future-v8-themedIcons: ${themedIcons}`;
	return compileString(
		`@use "variables" with (\n\t$ms3-iconPath: "icons/"${flag}\n);\n@use "default";\n@use "themes/2022-03" as theme;\n`,
		{
			loadPaths: [scssRoot, path.join(packageRoot, "node_modules")],
			quietDeps: true,
		},
	).css;
}

/** Declarations (`property: value`) that reference a chrome icon file. */
function iconDeclarations(css: string) {
	return [...css.matchAll(/([\w-]+):[^;{}]*mapsight-ui\/([\w-]+\.svg)/g)].map(
		([, property, file]) => ({property, file}),
	);
}

function scssFiles(dir: string): string[] {
	return readdirSync(dir, {withFileTypes: true}).flatMap((entry) =>
		entry.isDirectory()
			? scssFiles(path.join(dir, entry.name))
			: entry.name.endsWith(".scss")
				? [path.join(dir, entry.name)]
				: [],
	);
}

describe("chrome icon SCSS", () => {
	const legacy = compile();
	const themed = compile(true);

	it("keeps background-image icons unless the host opts in", () => {
		expect(compile(false)).toBe(legacy);
		expect(legacy).not.toMatch(/mask/);
		expect(legacy).not.toMatch(/--ms3-icon-color/);
		for (const {property} of iconDeclarations(legacy)) {
			expect(property).toMatch(/^background(-image)?$/);
		}
	});

	it("paints chrome icons as masks while preserving the attribution artwork", () => {
		const declarations = iconDeclarations(themed);
		const background = declarations.filter(
			({property}) => !property.includes("mask"),
		);
		expect(background).toEqual([
			{
				property: "background",
				file: "built-with-mapsight-de-120x40-light.svg",
			},
			{
				property: "background-image",
				file: "built-with-mapsight-en-120x40-light.svg",
			},
			{
				property: "background-image",
				file: "built-with-mapsight-de-90x30-light.svg",
			},
			{
				property: "background-image",
				file: "built-with-mapsight-en-90x30-light.svg",
			},
		]);

		const legacyFiles = new Set(
			iconDeclarations(legacy).map((d) => d.file),
		);
		const maskFiles = new Set(
			declarations
				.filter(({property}) => property === "mask-image")
				.map((d) => d.file),
		);
		for (const file of attributionFiles) {
			legacyFiles.delete(file);
		}
		expect(maskFiles).toEqual(legacyFiles);
		for (const file of maskFiles) {
			expect(themed).toContain(
				`-webkit-mask-image: url("icons/mapsight-ui/${file}")`,
			);
		}
	});

	it("fills icons from theme tokens resolved on the icon box", () => {
		expect(themed).toContain(
			"background: var(--ms3-icon-color, var(--ms3-theme-color-a))",
		);
		expect(themed).toContain(
			"background: var(--ms3-icon-color-active, var(--ms3-theme-color-b))",
		);
		expect(themed).toContain(
			"background: var(--ms3-icon-color-error, var(--ms3-theme-color-b))",
		);
		expect(themed).toContain(
			"background: var(--ms3-icon-color-muted, #a8a8a8)",
		);
		// optional host overrides: not emitted as tokens
		expect(themed).not.toMatch(/--ms3-icon-color[\w-]*:/);
	});

	it("switches masked icons to system colours in forced-colors mode", () => {
		const forced = [
			...themed.matchAll(
				/@media \(forced-colors: active\) \{([^{}]*\{[^{}]*\})+/g,
			),
		].map(([block]) => block);
		expect(forced.length).toBeGreaterThan(0);
		expect(forced.join("\n")).toContain("forced-color-adjust: none");
		// with `forced-color-adjust: none`, currentcolor resolves to the unforced colour
		expect(forced.join("\n")).not.toMatch(/background: currentcolor/i);
	});

	it("references only existing icon files", () => {
		for (const {file} of iconDeclarations(themed)) {
			const root = attributionFiles.has(file)
				? attributionRoot
				: iconRoot;
			expect(existsSync(path.join(root, file)), file).toBe(true);
		}
	});

	it("keeps url() expressions out of bundler url rebasing", () => {
		// Vite rewrites unquoted relative `url()` arguments in Sass partials before Sass
		// runs. It leaves arguments starting with `$` or `#{`, and quoted strings.
		const unsafe = scssFiles(scssRoot).flatMap((file) =>
			[...readFileSync(file, "utf8").matchAll(/url\(([^"')]+)\)/g)]
				.map(([, arg]) => arg.trim())
				.filter((arg) => !arg.startsWith("$") && !arg.startsWith("#{"))
				.map((arg) => `${path.relative(scssRoot, file)}: url(${arg})`),
		);
		expect(unsafe).toEqual([]);
	});
});
