#!/usr/bin/env node
import * as fs from "node:fs/promises";
import * as path from "node:path";
import {parseArgs} from "node:util";

import {watch} from "chokidar";
import * as fse from "fs-extra";
import sharp from "sharp";

import {buildIconFileGlobs} from "./lib/icon-asset-filter.ts";
import {
	DistMetaDataSchema,
	type IconGroupName,
	type IconVariant,
} from "./lib/meta.ts";

interface Tile {
	name: string;
	info: {
		width: number;
		height: number;
	};
	buffer: Buffer;
}

interface LayoutItem {
	width: number;
	height: number;
	x: number;
	y: number;
	meta: Tile;
}

interface Options {
	srcDir: string;
	spriteName: string;
	metaPath: string;
	outputScss: string;
	outputImg: string;
	groups: IconGroupName[];
	variants: IconVariant[];
	filetype: string;
	margin: number;
	overridesPath?: string;
}

async function buildIcons(opts: Options): Promise<void> {
	const {
		srcDir,
		spriteName,
		metaPath,
		outputScss,
		outputImg,
		groups = ["default"],
		variants = ["default", "small", "xsmall"],
		filetype = "png",
		margin = 4,
		overridesPath,
	} = opts;

	const absMetaPath = path.resolve(metaPath);
	if (!(await fse.pathExists(absMetaPath))) {
		throw new Error(`Missing metadata at ${absMetaPath}`);
	}
	const metaDataStr = await fs.readFile(absMetaPath, {encoding: "utf-8"});
	const metaData = DistMetaDataSchema.parse(JSON.parse(metaDataStr));

	const globs = buildIconFileGlobs(metaData.icons, {
		groups,
		variants,
		filetypes: [filetype],
		includeComposable: false,
	});

	const srcFiles = [];
	for (const pattern of globs) {
		for await (const entry of fs.glob(pattern, {
			cwd: srcDir,
		})) {
			srcFiles.push(path.resolve(srcDir, entry));
		}
	}
	console.log(`Found ${srcFiles.length} icon files matching globs`);

	const tmpDir = path.resolve("./tmp", spriteName);
	await fse.ensureDir(tmpDir);

	let copiedCount = 0;
	for (const srcFile of srcFiles) {
		const relPath = path.relative(srcDir, srcFile);
		const destFile = path.join(tmpDir, relPath);
		await fse.ensureDir(path.dirname(destFile));

		const doCopy = async () => {
			await fse.copy(srcFile, destFile);
			copiedCount++;
		};

		if (await fse.pathExists(destFile)) {
			const srcStat = await fs.stat(srcFile);
			const destStat = await fs.stat(destFile);
			if (destStat.mtime > srcStat.mtime) {
				continue;
			}
		}
		await doCopy();
	}
	console.log(`Copied ${copiedCount} icons to ${tmpDir}`);

	if (overridesPath) {
		const absOverrides = path.resolve(overridesPath);
		const overrideFiles = [];
		for (const pattern of globs) {
			for await (const entry of fs.glob(pattern, {
				cwd: absOverrides,
			})) {
				overrideFiles.push(path.resolve(absOverrides, entry));
			}
		}
		for (const ovFile of overrideFiles) {
			const relPath = path.relative(absOverrides, ovFile);
			const destFile = path.join(tmpDir, relPath);
			await fse.ensureDir(path.dirname(destFile));
			await fse.copy(ovFile, destFile);
		}
		console.log(`Copied overrides from ${overridesPath}`);
	}

	const tmpFiles = [];
	for await (const entry of fs.glob("**/*", {
		cwd: tmpDir,
	})) {
		tmpFiles.push(entry);
	}
	const tiles: Tile[] = [];
	for (const rel of tmpFiles) {
		const fullPath = path.join(tmpDir, rel);
		const stat = await fs.stat(fullPath);
		if (!stat.isFile()) continue;
		const buffer = await fs.readFile(fullPath);
		const metadata = await sharp(buffer).metadata();
		if (!metadata.width || !metadata.height) continue;
		const name = path.parse(rel).name;
		tiles.push({
			name,
			info: {width: metadata.width, height: metadata.height},
			buffer,
		});
	}

	const marginNum = Number(margin);
	let items: LayoutItem[] = tiles.map((tile) => ({
		width: tile.info.width + 2 * marginNum,
		height: tile.info.height + 2 * marginNum,
		meta: tile,
		x: 0,
		y: 0,
	}));

	items = items.sort((a, b) => a.height - b.height);

	let currentY = 0;
	for (const item of items) {
		item.x = 0;
		item.y = currentY;
		currentY += item.height;
	}

	const layoutWidth =
		items.length > 0 ? Math.max(...items.map((i) => i.width)) : 0;
	const layoutHeight = currentY;

	// SCSS
	const absScssDir = path.resolve(outputScss);
	await fse.ensureDir(absScssDir);
	const scssFile = path.join(absScssDir, `${spriteName}.scss`);
	let scssContent = `$${spriteName}: (\n`;
	for (const item of items) {
		scssContent += `  "${item.meta.name}": (
    x: ${item.x},
    y: ${item.y},
    width: ${item.width},
    height: ${item.height},
  ),
`;
	}
	scssContent += `);\n`;
	await fs.writeFile(scssFile, scssContent, "utf-8");
	console.log(`Generated SCSS: ${scssFile}`);

	// PNG
	const absImgDir = path.resolve(outputImg);
	await fse.ensureDir(absImgDir);
	const pngFile = path.join(absImgDir, `${spriteName}.png`);
	const spriteSharp = sharp({
		create: {
			width: layoutWidth,
			height: layoutHeight,
			channels: 4,
			background: {r: 0, g: 0, b: 0, alpha: 0},
		},
	});
	const composites = items.map((item) => ({
		input: item.meta.buffer,
		left: item.x + marginNum,
		top: item.y + marginNum,
	}));
	await spriteSharp.composite(composites).png({effort: 10}).toFile(pngFile);
	console.log(`Generated PNG: ${pngFile} (${layoutWidth}x${layoutHeight})`);
}

const debounceAsync = (fn: () => Promise<void>, delay: number) => {
	let timer: NodeJS.Timeout;
	return () => {
		clearTimeout(timer);
		timer = setTimeout(() => {
			fn().catch(console.error);
		}, delay);
	};
};

const {values: options, positionals} = parseArgs({
	options: {
		"sprite-name": {type: "string", short: "n"},
		"meta-path": {type: "string", short: "m"},
		"output-scss": {type: "string", short: "s"},
		"output-img": {type: "string", short: "i"},
		groups: {type: "string", short: "g"},
		variants: {type: "string", short: "v"},
		filetype: {type: "string", short: "f"},
		margin: {type: "string"},
		overrides: {type: "string", short: "o"},
		watch: {type: "boolean", short: "w"},
	},
	allowPositionals: true,
});

const srcDir =
	positionals[0] ??
	"node_modules/@mapsight/traffic-style/img/mapsight-icons-2x/";
const absOpts: Options = {
	srcDir: path.resolve(srcDir),
	spriteName:
		options["sprite-name"] ?? "mapsight-traffic-style-icon-sprite-2x",
	metaPath:
		options["meta-path"] ??
		"node_modules/@mapsight/traffic-style/meta.json",
	outputScss: options["output-scss"] ?? "dist/",
	outputImg: options["output-img"] ?? "dist/img/",
	groups: (options.groups?.split(",") as IconGroupName[]) ?? ["default"],
	variants: (options.variants?.split(",") as IconVariant[]) ?? [
		"default",
		"small",
		"xsmall",
	],
	filetype: options.filetype ?? "png",
	margin: parseInt(options.margin ?? "4", 10),
	overridesPath: options.overrides,
};

const runBuild = () => buildIcons(absOpts);

await runBuild();

if (options.watch) {
	const debouncedBuild = debounceAsync(runBuild, 300);
	const watchPaths = [absOpts.srcDir, absOpts.metaPath];
	if (absOpts.overridesPath)
		watchPaths.push(path.resolve(absOpts.overridesPath));
	watch(watchPaths, {ignored: /node_modules|tmp/}).on("all", debouncedBuild);
	console.log(`Watching ${watchPaths.join(", ")}...`);
}
