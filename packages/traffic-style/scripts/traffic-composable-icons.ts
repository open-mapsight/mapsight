#!/usr/bin/env node
import {existsSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {parseArgs} from "node:util";

import type {IconVariant} from "#icon/icon-id.js";

import {
	COMPOSABLE_VARIANTS,
	buildComposableIcons,
} from "./lib/composable-icons.ts";
import {parsePictogramPacks} from "./lib/pictogram-packs.ts";

/** Published package: `dist/meta.json`. Package development: `src/meta.json`. */
function resolveDefaultMetaPath(): string {
	const packageRoot = path.resolve(
		path.dirname(fileURLToPath(import.meta.url)),
		"..",
	);
	const distMeta = path.join(packageRoot, "meta.json");
	return existsSync(distMeta)
		? distMeta
		: path.join(packageRoot, "src/meta.json");
}

export async function main(argv = process.argv.slice(2)): Promise<number> {
	const {values: options} = parseArgs({
		args: argv,
		options: {
			"meta-path": {type: "string", short: "m"},
			dest: {type: "string", short: "d"},
			scale: {type: "string", short: "s"},
			variants: {type: "string", short: "v"},
			icons: {type: "string", short: "i"},
			groups: {type: "string", short: "g"},
			pack: {type: "string", short: "p"},
			background: {type: "string", short: "b"},
			foreground: {type: "string", short: "f"},
			"mapsight-icon-id": {type: "string"},
			format: {type: "string"},
			svg: {type: "boolean"},
			help: {type: "boolean", short: "h"},
		},
	});

	if (options.help) {
		printHelp();
		return 0;
	}

	const dest = options.dest;
	if (!dest) {
		throw new Error("Missing required option: --dest");
	}

	const variants = options.variants
		?.split(",")
		.map((value) => value.trim())
		.filter(Boolean) as IconVariant[] | undefined;

	const iconIds = options.icons
		?.split(",")
		.map((value) => value.trim())
		.filter(Boolean);

	const groups = options.groups
		?.split(",")
		.map((value) => value.trim())
		.filter(Boolean);

	const packs = parsePictogramPacks(options.pack);

	const colors =
		options.background || options.foreground
			? {
					background: options.background,
					foreground: options.foreground,
				}
			: undefined;

	const metaPath = options["meta-path"] ?? resolveDefaultMetaPath();

	if (!options["mapsight-icon-id"] && !options["meta-path"]) {
		console.warn(`Using default meta path: ${metaPath}`);
	}

	const format = options.format ?? (options.svg ? "both" : "png");

	const count = await buildComposableIcons({
		metaPath: options["mapsight-icon-id"] ? undefined : metaPath,
		dest: path.resolve(dest),
		scale: options.scale ? Number.parseInt(options.scale, 10) : 1,
		variants,
		iconIds,
		groups,
		packs,
		colors,
		mapsightIconId: options["mapsight-icon-id"],
		format: format as "png" | "svg" | "both",
	});

	console.log(
		`Built ${count} composable icon asset(s) in ${path.resolve(dest)}`,
	);
	return count;
}

function printHelp(): void {
	console.log(`Usage: traffic-composable-icons --dest <dir> [options]

Build composable icon PNGs (and optionally SVG) from src/meta.json or a custom
mapsightIconId with explicit colors.

Options:
  -d, --dest <dir>           Output directory (required)
  -m, --meta-path <file>     Source meta.json (default: package meta.json)
  -s, --scale <n>            Pixel scale (1 or 2, default: 1)
  -v, --variants <list>      Comma-separated variants (default: ${COMPOSABLE_VARIANTS.join(",")})
  -i, --icons <list>         Limit to comma-separated icon ids from meta
  -g, --groups <list>        Limit to icons in comma-separated meta groups
  -p, --pack <list>          Pictogram packs: traffic-style, fontawesome
                             (default: traffic-style)
  -b, --background <color>   Override background color (#rrggbb)
  -f, --foreground <color>   Override foreground color (#rrggbb)
      --mapsight-icon-id <id> Build one compact id, e.g. museum/#be123c/#ffffff
      --format <png|svg|both>  Output format (default: png; --svg is alias for both)
  -h, --help                 Show this help

Examples:
  traffic-composable-icons --dest ./dist/img/mapsight-icons
  traffic-composable-icons --dest ./out --mapsight-icon-id "museum/#be123c" --variants default,plain
  traffic-composable-icons --dest ./out --icons museum,apotheke --background "#035799"
  traffic-composable-icons --dest ./out --pack fontawesome --variants default,plain
  traffic-composable-icons --dest ./out --pack traffic-style,fontawesome --groups poi
`);
}

const isMain =
	process.argv[1] &&
	path.resolve(process.argv[1]) ===
		path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
	main().catch((error: unknown) => {
		console.error(error);
		process.exitCode = 1;
	});
}
