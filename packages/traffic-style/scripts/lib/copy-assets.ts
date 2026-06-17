import {cp, mkdir, readdir, stat} from "node:fs/promises";
import path from "node:path";

import {
	type IconAssetResolution,
	iconAssetMatchesFilters,
	loadIconAssetMeta,
	parseIconAssetPath,
} from "./icon-asset-filter.ts";
import type {IconGroupName, IconMeta, IconVariant} from "./meta.ts";

export type CopyTrafficStyleAssetsOptions = {
	src: string;
	dest: string;
	metaPath?: string;
	withoutComposableIcons?: boolean;
	groups?: IconGroupName[];
	variants?: IconVariant[];
	filetypes?: string[];
	resolutions?: IconAssetResolution[];
};

export type CopyTrafficStyleAssetsResult = {
	copied: number;
	skipped: number;
};

async function copyDirectory(
	srcRoot: string,
	destRoot: string,
	relativeDir: string,
	iconMetaById: Map<string, IconMeta>,
	options: Pick<
		CopyTrafficStyleAssetsOptions,
		| "withoutComposableIcons"
		| "groups"
		| "variants"
		| "filetypes"
		| "resolutions"
	>,
	result: CopyTrafficStyleAssetsResult,
): Promise<void> {
	const absSrcDir = path.join(srcRoot, relativeDir);
	const entries = await readdir(absSrcDir, {withFileTypes: true});

	for (const entry of entries) {
		const relativePath = path.join(relativeDir, entry.name);
		const absSrcPath = path.join(srcRoot, relativePath);
		const absDestPath = path.join(destRoot, relativePath);

		if (entry.isDirectory()) {
			await copyDirectory(
				srcRoot,
				destRoot,
				relativePath,
				iconMetaById,
				options,
				result,
			);
			continue;
		}

		if (!entry.isFile()) {
			continue;
		}

		const iconAsset = parseIconAssetPath(relativePath);
		if (
			iconAsset &&
			!iconAssetMatchesFilters(
				iconAsset,
				iconMetaById.get(iconAsset.iconId),
				{
					groups: options.groups,
					variants: options.variants,
					filetypes: options.filetypes,
					resolutions: options.resolutions,
					includeComposable: !options.withoutComposableIcons,
				},
			)
		) {
			result.skipped += 1;
			continue;
		}

		await mkdir(path.dirname(absDestPath), {recursive: true});
		await cp(absSrcPath, absDestPath);
		result.copied += 1;
	}
}

export async function copyTrafficStyleAssets(
	options: CopyTrafficStyleAssetsOptions,
): Promise<CopyTrafficStyleAssetsResult> {
	const srcRoot = path.resolve(options.src);
	const destRoot = path.resolve(options.dest);
	const srcStats = await stat(srcRoot);

	if (!srcStats.isDirectory()) {
		throw new Error(`Source is not a directory: ${srcRoot}`);
	}

	if (
		(options.withoutComposableIcons || options.groups?.length) &&
		!options.metaPath
	) {
		throw new Error(
			"--meta-path is required with --without-composable-icons or --groups",
		);
	}

	const iconMetaById = options.metaPath
		? new Map(
				(await loadIconAssetMeta(options.metaPath)).map((iconMeta) => [
					iconMeta.id,
					iconMeta,
				]),
			)
		: new Map<string, IconMeta>();
	const result = {copied: 0, skipped: 0};

	await mkdir(destRoot, {recursive: true});
	await copyDirectory(srcRoot, destRoot, "", iconMetaById, options, result);

	return result;
}
