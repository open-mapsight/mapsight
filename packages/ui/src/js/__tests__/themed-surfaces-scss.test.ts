// @vitest-environment node
import {readFileSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {compileString} from "sass";
import {describe, expect, it} from "vitest";

const packageRoot = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"../../..",
);
const scssRoot = path.join(packageRoot, "src/scss");

function compile(flags: Record<string, boolean> = {}) {
	const vars = [
		`$ms3-iconPath: "icons/"`,
		...Object.entries(flags).map(
			([name, on]) => `$ms3-future-v8-${name}: ${on}`,
		),
	];
	return compileString(
		`@use "variables" with (\n\t${vars.join(",\n\t")}\n);\n@use "reset";\n@use "default";\n@use "themes/2022-03" as theme;\n`,
		{
			loadPaths: [scssRoot, path.join(packageRoot, "node_modules")],
			quietDeps: true,
		},
	).css;
}

type Declaration = {selector: string; property: string; value: string};

/** Flat list of declarations (media queries are not tracked; order is kept). */
function declarations(css: string): Declaration[] {
	return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].flatMap(
		([, rawSelector, body]) => {
			const selector = rawSelector.trim().replace(/\s+/g, " ");
			return body
				.split(/;(?![^(]*\))/)
				.map((decl) => decl.trim())
				.filter(Boolean)
				.map((decl) => {
					const colon = decl.indexOf(":");
					return {
						selector,
						property: decl.slice(0, colon).trim(),
						value: decl
							.slice(colon + 1)
							.trim()
							.replace(/\s+/g, " "),
					};
				});
		},
	);
}

/** `selector|property#n` so repeated rules (media queries) stay distinct. */
function keyed(list: Declaration[]) {
	const seen = new Map<string, number>();
	return new Map(
		list.map((d) => {
			const base = `${d.selector}|${d.property}`;
			const n = seen.get(base) ?? 0;
			seen.set(base, n + 1);
			return [`${base}#${n}`, d.value];
		}),
	);
}

const literal = /#[0-9a-f]{3,8}\b|\b(?:white|black)\b|\brgba?\(|\bhsla?\(/i;

function withoutVarFallbacks(value: string) {
	let previous;
	do {
		previous = value;
		value = value.replace(
			/var\((--[\w-]+)(?:,[^()]*(?:\([^()]*\))?[^()]*)?\)/g,
			"var($1)",
		);
	} while (value !== previous);
	return value;
}

/** Product declarations that still use colour literals once themed. */
function literalDeclarations(css: string) {
	return declarations(css).filter(
		({selector, property, value}) =>
			!property.startsWith("--") &&
			!selector.startsWith(".ol-") &&
			!selector.includes("ms3-hint") &&
			literal.test(withoutVarFallbacks(value)),
	);
}

// --- colour maths ----------------------------------------------------------

type Rgba = [number, number, number, number];

const named: Record<string, Rgba> = {
	white: [255, 255, 255, 1],
	black: [0, 0, 0, 1],
	transparent: [0, 0, 0, 0],
};

function parseColor(input: string): Rgba {
	const c = input.trim().toLowerCase();
	if (named[c]) return named[c];
	const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(c);
	if (hex) {
		const h =
			hex[1].length === 3
				? hex[1]
						.split("")
						.map((x) => x + x)
						.join("")
				: hex[1];
		const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
		return [r, g, b, 1];
	}
	const fn = /^rgba?\((.*)\)$/.exec(c);
	if (fn) {
		const parts = fn[1].split(/[\s,/]+/).filter(Boolean);
		const alpha =
			parts[3] === undefined
				? 1
				: parts[3].endsWith("%")
					? parseFloat(parts[3]) / 100
					: parseFloat(parts[3]);
		return [+parts[0], +parts[1], +parts[2], alpha];
	}
	const mix = /^color-mix\(in srgb, (.*) ([\d.]+)%, (.*)\)$/.exec(c);
	if (mix) {
		// premultiplied interpolation, like browsers
		const a = parseColor(mix[1]);
		const b = parseColor(mix[3]);
		const p = parseFloat(mix[2]) / 100;
		const alpha = a[3] * p + b[3] * (1 - p);
		const channel = (i: number) =>
			alpha === 0 ? 0 : (a[i] * a[3] * p + b[i] * b[3] * (1 - p)) / alpha;
		return [channel(0), channel(1), channel(2), alpha];
	}
	throw new Error(`cannot parse colour: ${input}`);
}

function over(top: Rgba, bottom: Rgba): Rgba {
	const a = top[3] + bottom[3] * (1 - top[3]);
	const channel = (i: number) =>
		(top[i] * top[3] + bottom[i] * bottom[3] * (1 - top[3])) / a;
	return [channel(0), channel(1), channel(2), a];
}

function luminance([r, g, b]: Rgba) {
	const lin = (v: number) => {
		const s = v / 255;
		return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
	};
	return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a: Rgba, b: Rgba) {
	const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
}

/** Substitutes `var()`s (with fallbacks) from `tokens`, innermost first. */
function resolve(value: string, tokens: Record<string, string>): string {
	let previous;
	do {
		previous = value;
		value = value.replace(
			/var\((--[\w-]+)(?:,\s*((?:[^()]|\([^()]*\))*))?\)/g,
			(match, name: string, fallback?: string) =>
				tokens[name] ??
				(fallback === undefined ? match : fallback.trim()),
		);
	} while (value !== previous);
	return value;
}

const colourToken =
	/color-mix\(in srgb, [^()]*(?:\([^()]*\))?[^()]*\)|#[0-9a-f]{3,8}\b|\brgba?\([^()]*\)|\b(?:white|black|transparent)\b/gi;

/** Resolves roles and writes every colour as `rgba()` so equal colours compare equal. */
function normalise(value: string, tokens: Record<string, string>) {
	return resolve(value, tokens).replace(colourToken, (c) => {
		const [r, g, b, a] = parseColor(c).map((v, i) =>
			i < 3 ? Math.round(v) : +v.toFixed(3),
		);
		return `rgba(${r}, ${g}, ${b}, ${a})`;
	});
}

function rootTokens(css: string) {
	const root = declarations(css).filter(
		(d) => d.selector === ":root" && d.property.startsWith("--ms3-"),
	);
	return Object.fromEntries(root.map((d) => [d.property, d.value]));
}

// Exercise the published recipe itself, including its component-token overrides
// and text rules for portals outside `.ms3-wrapper`.
const readme = readFileSync(path.join(packageRoot, "README.md"), "utf8");
const darkHostCss = readme.match(
	/```css\n(@media \(prefers-color-scheme: dark\)[\s\S]*?)```/,
)![1];

describe("themed surfaces SCSS", () => {
	const legacy = compile();
	const themed = compile({themedSurfaces: true});
	const both = compile({themedSurfaces: true, themedIcons: true});
	const defaults = rootTokens(legacy);

	// Kept on purpose: elevation shadows (dark on any surface), the white halos that
	// keep map-only marks visible on tiles, and near-transparent border placeholders
	// for transitions.
	const kept = (d: Declaration) =>
		d.property === "box-shadow" ||
		/^\.ms3-map-target|^\.ms3-map-point-menu__crosshair/.test(d.selector) ||
		/rgba\(255, 255, 255, 0\.01\)/.test(d.value);

	it("keeps today's colours unless the host opts in", () => {
		expect(compile({themedSurfaces: false})).toBe(legacy);
		expect(legacy).not.toMatch(/color-scheme/);
		expect(legacy).not.toMatch(/--ms3-map-control-background-color/);
		expect(legacy).toMatch(/\.ms3-wrapper \{\s*background: white;/);
	});

	it("routes every former colour literal through a role when opted in", () => {
		const before = literalDeclarations(legacy).filter((d) => !kept(d));
		expect(before.length).toBeGreaterThan(20);
		for (const css of [themed, both]) {
			expect(literalDeclarations(css).filter((d) => !kept(d))).toEqual(
				[],
			);
		}
		// role overrides are optional: not emitted by `tokens`
		expect(themed).not.toMatch(
			/--ms3-(?:map-control-background-color|color-scheme)\s*:/,
		);
		expect(rootTokens(themed)).toEqual(defaults);
	});

	it("resolves to today's values in the default theme", () => {
		const legacyValues = keyed(declarations(legacy));
		const themedValues = keyed(declarations(themed));
		const changed: Record<string, [string, string | undefined]> = {};
		for (const [key, value] of legacyValues) {
			if (!literal.test(value)) continue;
			const now = themedValues.get(key);
			const a = normalise(value, defaults);
			const b = now === undefined ? undefined : normalise(now, defaults);
			if (a !== b) changed[key] = [a, b];
		}
		// documented corrections (see the README): near-duplicate greys collapse onto roles
		expect(changed).toEqual({
			".ms3-link-share__input|color#0": [
				"rgba(68, 68, 68, 1)",
				"rgba(34, 34, 34, 1)",
			],
			".ms3-link-share__input|background#0": [
				"rgba(245, 245, 245, 1)",
				"rgba(242, 242, 242, 1)",
			],
			".ms3-list-pagination__page--disabled|color#0": [
				"rgba(85, 85, 85, 1)",
				"rgba(99, 101, 103, 1)",
			],
			".ms3-marked-point-coords|color#0": [
				"rgba(92, 92, 92, 1)",
				"rgba(99, 101, 103, 1)",
			],
			".ms3-search__reset-button::before|background#0": [
				'rgba(238, 238, 238, 1) url("icons/mapsight-ui/close.svg") no-repeat center',
				'rgba(242, 242, 242, 1) url("icons/mapsight-ui/close.svg") no-repeat center',
			],
			// dead declaration dropped: the `background` shorthand later in the same rule
			// always replaced it, and is now the rule's first `background`
			".ms3-query-input-with-label__reset-button|background#0": [
				"rgba(14, 120, 173, 1)",
				'rgba(0, 0, 0, 0) url("icons/mapsight-ui//reset.svg") no-repeat center',
			],
		});
	});

	it("follows the host colour scheme without forcing one", () => {
		const wrapper = declarations(themed).filter(
			(d) => d.selector === ".ms3-wrapper",
		);
		// no fallback: unset `--ms3-color-scheme` inherits the host's `color-scheme`
		expect(wrapper).toContainEqual({
			selector: ".ms3-wrapper",
			property: "color-scheme",
			value: "var(--ms3-color-scheme)",
		});
		expect(declarations(themed)).toContainEqual({
			selector:
				":where(.ms3-wrapper) :where(button, input, select, textarea)",
			property: "color",
			value: "inherit",
		});
	});

	describe("with a dark host theme", () => {
		const tokens = {...defaults, ...rootTokens(darkHostCss)};
		const all = [...declarations(both), ...declarations(darkHostCss)];
		const value = (selector: string, property: string) => {
			const found = all.filter(
				(d) =>
					(d.selector === selector ||
						d.selector.split(", ").includes(selector)) &&
					d.property === property,
			);
			expect(found, `${selector} { ${property} }`).not.toHaveLength(0);
			return found.at(-1)!.value;
		};
		const colour = (selector: string, property: string) =>
			parseColor(resolve(value(selector, property), tokens));
		const token = (name: string) =>
			parseColor(resolve(`var(${name})`, tokens));
		const text = colour(".ms3-wrapper", "color");
		const tiles = {light: parseColor("#f2efe9"), dark: parseColor("#000")};

		it("paints the former light surfaces dark", () => {
			for (const [selector, property] of [
				[".ms3-wrapper", "background"],
				[".ms3-tool-overlay", "background-color"],
				[".ms3-mini-legend", "background"],
				[
					".ms3-mini-legend select, .ms3-mini-legend button",
					"background",
				],
				[".ms3-link-share__button", "background"],
				[".ms3-query-input-with-label__input", "background"],
			]) {
				expect(
					luminance(colour(selector, property)),
					selector,
				).toBeLessThan(0.05);
			}
		});

		it("keeps text at 4.5:1 or more", () => {
			const attribution = resolve(
				value(".ms3-attribution", "background"),
				tokens,
			)
				.match(colourToken)!
				.map(parseColor);
			const pairs: [string, Rgba, Rgba][] = [
				[
					"attribution",
					colour(".ms3-attribution", "color"),
					over(attribution[0], attribution.at(-1)!),
				],
				[
					"list search input",
					colour(".ms3-query-input-with-label__input", "color"),
					colour(".ms3-query-input-with-label__input", "background"),
				],
				[
					"link share input",
					colour(".ms3-link-share__input", "color"),
					colour(".ms3-link-share__input", "background"),
				],
				[
					"marked point coordinates",
					colour(".ms3-marked-point-coords", "color"),
					token("--ms3-background-color"),
				],
				[
					"disabled page",
					colour(".ms3-list-pagination__page--disabled", "color"),
					token("--ms3-page-background-color"),
				],
				["wrapper text", text, colour(".ms3-wrapper", "background")],
				["panel text", text, token("--ms3-background-color")],
				[
					"place actions",
					colour(".ms3-place-actions", "color"),
					token("--ms3-background-color"),
				],
				[
					"outbound links",
					colour(".ms3-outbound-link", "color"),
					token("--ms3-background-color"),
				],
				[
					"portaled modal text",
					colour(".ms3-modal__inner", "color"),
					colour(".ms3-modal__inner", "background"),
				],
				[
					"portaled list options text",
					colour(".ms3-list-options__popover", "color"),
					colour(".ms3-list-options__popover", "background"),
				],
				[
					"text on offset",
					text,
					token("--ms3-background-color-offset"),
				],
				[
					"text on highlight",
					text,
					token("--ms3-background-highlight-color"),
				],
				[
					"muted text",
					token("--ms3-secondary-color"),
					token("--ms3-background-color"),
				],
				[
					"muted text on offset",
					token("--ms3-secondary-color"),
					token("--ms3-background-color-offset"),
				],
				[
					"links and retry",
					token("--ms3-theme-color-a"),
					token("--ms3-background-color"),
				],
				[
					"active text",
					token("--ms3-theme-color-b"),
					token("--ms3-background-highlight-color"),
				],
				[
					"filter button",
					token("--ms3-inverted-primary-color"),
					token("--ms3-tertiary-color"),
				],
				[
					"active filter button",
					token("--ms3-inverted-primary-color"),
					token("--ms3-primary-color"),
				],
				[
					"map tool action",
					token("--ms3-foreground-color"),
					token("--ms3-background-color"),
				],
			];
			for (const [name, fg, bg] of pairs) {
				expect(contrast(fg, bg), name).toBeGreaterThanOrEqual(4.5);
			}
		});

		it("keeps icons, focus rings and field borders at 3:1 or more", () => {
			const mapControl = colour(
				".ms3-map-overlay-combined-buttons",
				"background",
			);
			const pairs: [string, Rgba, Rgba][] = [
				[
					"focus ring",
					token("--ms3-primary-color"),
					token("--ms3-background-color"),
				],
				[
					"focus ring on highlight",
					token("--ms3-primary-color"),
					token("--ms3-background-highlight-color"),
				],
				[
					"point input focus ring",
					token("--ms3-focus-ring-color"),
					token("--ms3-background-color"),
				],
				// the same token draws the map focus ring on (untouched, light) tiles
				[
					"map focus ring on light tiles",
					token("--ms3-focus-ring-color"),
					tiles.light,
				],
				[
					"icon on panel",
					token("--ms3-theme-color-a"),
					token("--ms3-background-color"),
				],
				[
					"icon on map control over light tiles",
					token("--ms3-theme-color-a"),
					over(mapControl, tiles.light),
				],
				[
					"icon on map control over dark tiles",
					token("--ms3-theme-color-a"),
					over(mapControl, tiles.dark),
				],
				[
					"active icon",
					token("--ms3-theme-color-b"),
					token("--ms3-background-highlight-color"),
				],
				[
					"field border",
					parseColor(
						resolve(
							value(
								".ms3-query-input-with-label__input",
								"border",
							).replace(/^1px solid /, ""),
							tokens,
						),
					),
					token("--ms3-page-background-color"),
				],
				[
					"share icon",
					colour(".ms3-link-share__button path[fill]", "fill"),
					colour(".ms3-link-share__button", "background"),
				],
			];
			for (const [name, fg, bg] of pairs) {
				expect(contrast(fg, bg), name).toBeGreaterThanOrEqual(3);
			}
		});
	});
});
