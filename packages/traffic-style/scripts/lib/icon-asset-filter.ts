import {readFile} from "node:fs/promises";
import path from "node:path";

import {z} from "zod/v4";

import {
	DistMetaDataSchema,
	type IconGroupName,
	type IconMeta,
	type IconVariant,
	IconVariantSchema,
	SourceIconMetaSchema,
} from "./meta.ts";

const SourceMetaDataSchema = z.object({
	icons: z.record(z.string(), SourceIconMetaSchema).optional(),
});

const ICON_ASSET_DIRS = {
	"mapsight-icons": "1x",
	"mapsight-icons-2x": "2x",
	"mapsight-icons-svg": "svg",
} as const;

export type IconAssetResolution =
	(typeof ICON_ASSET_DIRS)[keyof typeof ICON_ASSET_DIRS];

export type IconAssetFile = {
	assetDir: keyof typeof ICON_ASSET_DIRS;
	resolution: IconAssetResolution;
	iconId: string;
	variant: IconVariant;
	filetype: string;
};

export type IconCatalogFilters = {
	groups?: IconGroupName[];
	variants?: IconVariant[];
	filetypes?: string[];
	resolutions?: IconAssetResolution[];
	includeComposable?: boolean;
};

export async function loadIconAssetMeta(metaPath: string): Promise<IconMeta[]> {
	const raw = JSON.parse(await readFile(metaPath, "utf8")) as unknown;
	const distMeta = DistMetaDataSchema.safeParse(raw);

	if (distMeta.success) {
		return distMeta.data.icons;
	}

	const sourceMeta = SourceMetaDataSchema.parse(raw);
	return Object.entries(sourceMeta.icons ?? {}).map(([id, iconMeta]) => ({
		id,
		...iconMeta,
	}));
}

export function iconMatchesCatalogFilters(
	iconMeta: Pick<IconMeta, "groups" | "render">,
	filters: Pick<IconCatalogFilters, "groups" | "includeComposable">,
): boolean {
	if (!filters.includeComposable && iconMeta.render === "composable") {
		return false;
	}

	return (
		!filters.groups?.length ||
		filters.groups.some((group) => iconMeta.groups?.includes(group))
	);
}

export function buildIconFileGlobs(
	icons: IconMeta[],
	filters: Pick<
		IconCatalogFilters,
		"groups" | "variants" | "filetypes" | "includeComposable"
	>,
): string[] {
	const variants = filters.variants ?? ["default", "small", "xsmall"];
	const filetypes = filters.filetypes ?? ["png"];

	return icons
		.filter((iconMeta) => iconMatchesCatalogFilters(iconMeta, filters))
		.flatMap((iconMeta) =>
			variants.flatMap((variant) =>
				filetypes.map(
					(filetype) => `**/${iconMeta.id}-${variant}.${filetype}`,
				),
			),
		);
}

export function parseIconAssetPath(relativePath: string): IconAssetFile | null {
	const parts = relativePath.split(path.sep);
	const assetDir = parts.at(0) as keyof typeof ICON_ASSET_DIRS | undefined;

	if (!assetDir || !(assetDir in ICON_ASSET_DIRS)) {
		return null;
	}

	const extension = path.extname(relativePath);
	const filetype = extension.slice(1);
	if (!filetype) {
		return null;
	}

	const basename = path.basename(relativePath, extension);
	const separator = basename.lastIndexOf("-");
	if (separator === -1) {
		return null;
	}

	const iconId = basename.slice(0, separator);
	const variant = IconVariantSchema.safeParse(basename.slice(separator + 1));

	if (!variant.success) {
		return null;
	}

	return {
		assetDir,
		resolution: ICON_ASSET_DIRS[assetDir],
		iconId,
		variant: variant.data,
		filetype,
	};
}

export function iconAssetMatchesFilters(
	asset: IconAssetFile,
	iconMeta: IconMeta | undefined,
	filters: IconCatalogFilters,
): boolean {
	if (
		filters.resolutions?.length &&
		!filters.resolutions.includes(asset.resolution)
	) {
		return false;
	}
	if (
		filters.filetypes?.length &&
		!filters.filetypes.includes(asset.filetype)
	) {
		return false;
	}
	if (filters.variants?.length && !filters.variants.includes(asset.variant)) {
		return false;
	}
	if (filters.groups?.length) {
		return iconMeta
			? iconMatchesCatalogFilters(iconMeta, {
					groups: filters.groups,
					includeComposable: filters.includeComposable,
				})
			: false;
	}
	if (!filters.includeComposable && iconMeta?.render === "composable") {
		return false;
	}

	return true;
}
