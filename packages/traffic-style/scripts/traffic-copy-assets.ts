#!/usr/bin/env node
import {existsSync, realpathSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {parseArgs} from "node:util";

import {copyTrafficStyleAssets} from "./lib/copy-assets.ts";
import type {IconAssetResolution} from "./lib/icon-asset-filter.ts";

function resolvePackageRoot(): string {
	return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
}

function resolveDefaultSourcePath(): string {
	return path.join(resolvePackageRoot(), "img");
}

function resolveDefaultMetaPath(): string {
	const packageRoot = resolvePackageRoot();
	const distMeta = path.join(packageRoot, "meta.json");
	return existsSync(distMeta)
		? distMeta
		: path.join(packageRoot, "src/meta.json");
}

function parseList(value: string | undefined): string[] | undefined {
	return value
		?.split(",")
		.map((item) => item.trim())
		.filter(Boolean);
}

function parseFiletypes(value: string | undefined): string[] | undefined {
	return parseList(value)?.map((filetype) => filetype.replace(/^\./, ""));
}

function parseResolutions(
	value: string | undefined,
): IconAssetResolution[] | undefined {
	const resolutions = parseList(value);

	for (const resolution of resolutions ?? []) {
		if (
			resolution !== "1x" &&
			resolution !== "2x" &&
			resolution !== "svg"
		) {
			throw new Error(
				`Invalid resolution: ${resolution}. Expected 1x, 2x, or svg.`,
			);
		}
	}

	return resolutions as IconAssetResolution[] | undefined;
}

export async function main(argv = process.argv.slice(2)): Promise<number> {
	const {values: options} = parseArgs({
		args: argv,
		options: {
			src: {type: "string", short: "s"},
			dest: {type: "string", short: "d"},
			"meta-path": {type: "string", short: "m"},
			"without-composable-icons": {type: "boolean"},
			groups: {type: "string", short: "g"},
			variants: {type: "string", short: "v"},
			filetypes: {type: "string", short: "f"},
			filetype: {type: "string"},
			resolutions: {type: "string"},
			res: {type: "string", short: "r"},
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

	const withoutComposableIcons = options["without-composable-icons"] ?? false;
	const src = options.src ?? resolveDefaultSourcePath();
	const metaPath = options["meta-path"] ?? resolveDefaultMetaPath();
	const groups = parseList(options.groups);
	const variants = parseList(options.variants);
	const filetypes = parseFiletypes(options.filetypes ?? options.filetype);
	const resolutions = parseResolutions(options.resolutions ?? options.res);
	const result = await copyTrafficStyleAssets({
		src,
		dest,
		metaPath,
		withoutComposableIcons,
		groups,
		variants,
		filetypes,
		resolutions,
	});

	console.log(
		`Copied ${result.copied} traffic-style asset(s) to ${path.resolve(dest)}` +
			(result.skipped > 0
				? `; skipped ${result.skipped} composable icon asset(s)`
				: ""),
	);
	return result.copied;
}

function printHelp(): void {
	console.log(`Usage: traffic-copy-assets --dest <dir> [options]

Copy @mapsight/traffic-style image assets into a host app deploy directory.

Options:
  -d, --dest <dir>                 Output directory (required)
  -s, --src <dir>                  Source image directory (default: package img/)
  -m, --meta-path <file>           Source meta.json (default: package meta.json)
      --without-composable-icons   Skip pre-baked composable PNG/SVG catalog assets
  -g, --groups <list>              Copy catalog icon assets only from these groups
  -v, --variants <list>            Copy catalog icon assets only for these variants
  -f, --filetypes <list>           Copy catalog icon assets only for these file types
  -r, --res <list>                 Copy catalog icon assets only for 1x, 2x, svg
  -h, --help                       Show this help

Examples:
  traffic-copy-assets --dest public/img
  traffic-copy-assets --dest public/img --without-composable-icons
  traffic-copy-assets --dest public/img --groups default,education --variants default,small --res 2x

Skipped catalog assets are not deleted from the destination; run your app clean step once when changing filters.
`);
}

const isMain =
	process.argv[1] &&
	realpathSync(process.argv[1]) ===
		realpathSync(fileURLToPath(import.meta.url));

if (isMain) {
	main().catch((error: unknown) => {
		console.error(error);
		process.exitCode = 1;
	});
}
