import {mkdir, readFile, writeFile} from "node:fs/promises";
import path from "node:path";

import {composeSvg} from "#icon/compose.js";
import {pickContrastForeground} from "#icon/contrast.js";
import type {IconColors, IconSpec, IconVariant} from "#icon/icon-id.js";
import {parseMapsightIcon, resolveMapsightIconSpec} from "#icon/icon-id.js";
import {prepareSvgForRasterization} from "#icon/rasterize.js";
import {resolveSpec} from "#icon/resolve.js";
import {getTemplate} from "#icon/templates.js";
import sharp from "sharp";
import {z} from "zod/v4";

import {SourceIconMetaSchema} from "./meta.ts";
import {
	DEFAULT_COMPOSABLE_PACKS,
	type PictogramPack,
	ensurePictogramPacks,
	pictogramPackForIconId,
} from "./pictogram-packs.ts";

export const COMPOSABLE_VARIANTS = [
	"default",
	"small",
	"xsmall",
	"plain",
] as const satisfies readonly IconVariant[];

const SourceMetaSchema = z.object({
	icons: z.record(z.string(), SourceIconMetaSchema).optional(),
});

export type ComposableIconTarget = {
	iconId: string;
	variant: IconVariant;
	colors: Required<IconColors>;
};

export type BuildComposableIconsOptions = {
	metaPath?: string;
	dest: string;
	scale?: number;
	variants?: IconVariant[];
	iconIds?: string[];
	groups?: string[];
	colors?: IconColors;
	mapsightIconId?: string;
	format?: "png" | "svg" | "both";
	packs?: PictogramPack[];
};

export function composableIconBaseName(
	iconId: string,
	variant: IconVariant,
): string {
	return `${iconId}-${variant}`;
}

export function composableIconFileName(
	iconId: string,
	variant: IconVariant,
	format: "png" | "svg" = "png",
): string {
	return `${composableIconBaseName(iconId, variant)}.${format}`;
}

export function resolveIconColors(
	metaColors?: IconColors,
	override?: IconColors,
): Required<IconColors> {
	const defaults = resolveSpec({}).colors;
	const background =
		override?.background ?? metaColors?.background ?? defaults.background;
	const explicitForeground =
		override?.foreground ?? metaColors?.foreground ?? undefined;

	return {
		background,
		foreground: explicitForeground ?? pickContrastForeground(background),
	};
}

export function buildIconSpec(
	iconId: string,
	variant: IconVariant,
	colors: Required<IconColors>,
): IconSpec {
	const base = resolveMapsightIconSpec(iconId, variant);
	if (!base) {
		throw new Error(`Unable to resolve icon: ${iconId}`);
	}

	return {
		...base,
		variant,
		colors,
	};
}

export function buildTargetsFromMapsightIconId(
	mapsightIconId: string,
	variants: readonly IconVariant[],
): ComposableIconTarget[] {
	const parsed = parseMapsightIcon(mapsightIconId);
	if (!parsed) {
		throw new Error(`Invalid mapsightIconId: ${mapsightIconId}`);
	}

	const iconId =
		parsed.pictogram ??
		parsed.label?.slice(0, 2).toUpperCase() ??
		mapsightIconId.split("/")[0];
	if (!iconId) {
		throw new Error(`Invalid mapsightIconId: ${mapsightIconId}`);
	}

	const colors = resolveIconColors(parsed.colors);
	return variants.map((variant) => ({iconId, variant, colors}));
}

export async function loadComposableIconTargets(
	metaPath: string,
	options: Pick<
		BuildComposableIconsOptions,
		"variants" | "iconIds" | "groups" | "colors" | "packs"
	> = {},
): Promise<ComposableIconTarget[]> {
	const packs = options.packs ?? DEFAULT_COMPOSABLE_PACKS;
	const variants = options.variants ?? [...COMPOSABLE_VARIANTS];
	const meta = SourceMetaSchema.parse(
		JSON.parse(await readFile(path.resolve(metaPath), "utf8")),
	);
	const icons = meta.icons ?? {};
	const targets: ComposableIconTarget[] = [];

	for (const [iconId, iconMeta] of Object.entries(icons)) {
		if (iconMeta.render !== "composable") {
			continue;
		}
		if (options.iconIds?.length && !options.iconIds.includes(iconId)) {
			continue;
		}
		if (
			options.groups?.length &&
			!options.groups.some((group) => iconMeta.groups?.includes(group))
		) {
			continue;
		}
		if (!packs.includes(pictogramPackForIconId(iconId))) {
			continue;
		}

		const colors = resolveIconColors(iconMeta.colors, options.colors);
		for (const variant of variants) {
			targets.push({iconId, variant, colors});
		}
	}

	return targets;
}

export async function renderComposableIconPng(
	spec: IconSpec,
	scale = 1,
): Promise<{buffer: Buffer; width: number; height: number}> {
	const resolved = resolveSpec(spec);
	const template = getTemplate(resolved.variant);
	const width = Math.round(template.width * scale);
	const height = Math.round(template.height * scale);
	const svg = composeSvg(spec);
	const rasterSvg = prepareSvgForRasterization(svg, width, height);
	const buffer = await sharp(Buffer.from(rasterSvg)).png().toBuffer();

	return {buffer, width, height};
}

export async function writeComposableIconAssets(
	target: ComposableIconTarget,
	dest: string,
	options: Pick<BuildComposableIconsOptions, "scale" | "format"> = {},
): Promise<void> {
	const scale = options.scale ?? 1;
	const format = options.format ?? "png";
	const spec = buildIconSpec(target.iconId, target.variant, target.colors);
	await mkdir(dest, {recursive: true});

	if (format === "png" || format === "both") {
		const pngPath = path.join(
			dest,
			composableIconFileName(target.iconId, target.variant, "png"),
		);
		const {buffer} = await renderComposableIconPng(spec, scale);
		await writeFile(pngPath, buffer);
	}

	if (format === "svg" || format === "both") {
		const svgPath = path.join(
			dest,
			composableIconFileName(target.iconId, target.variant, "svg"),
		);
		await writeFile(svgPath, composeSvg(spec), "utf8");
	}
}

export async function buildComposableIcons(
	options: BuildComposableIconsOptions,
): Promise<number> {
	const packs = options.packs ?? DEFAULT_COMPOSABLE_PACKS;
	await ensurePictogramPacks(packs);

	const variants = options.variants ?? [...COMPOSABLE_VARIANTS];
	const targets = options.mapsightIconId
		? buildTargetsFromMapsightIconId(options.mapsightIconId, variants)
		: options.metaPath
			? await loadComposableIconTargets(options.metaPath, options)
			: [];

	if (targets.length === 0) {
		throw new Error("No composable icon targets to build");
	}

	for (const target of targets) {
		await writeComposableIconAssets(target, options.dest, options);
	}

	return targets.length;
}
