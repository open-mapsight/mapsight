import meta from "../meta.json" with {type: "json"};

export type IconRenderMode = "sprite" | "composable";

type SourceMetaIcon = {
	fallback?: string;
	id?: string;
	groups?: string[];
	render?: IconRenderMode;
	variants?: string[];
	label?: {
		de?: string;
		en?: string;
	};
};

type SourceMeta = {
	icons?: Record<string, SourceMetaIcon> | SourceMetaIcon[];
};

const sourceMeta = meta as SourceMeta;
const sourceIcons = new Map(
	Array.isArray(sourceMeta.icons)
		? sourceMeta.icons
				.map((icon) =>
					icon.id === undefined
						? undefined
						: ([icon.id, icon] as const),
				)
				.filter((entry) => entry !== undefined)
		: Object.entries(sourceMeta.icons ?? {}),
);

function baseIconId(id: string): string {
	return id.split("/")[0]!;
}

export function hasIcon(id: string): boolean {
	return sourceIcons.has(baseIconId(id));
}

export function getIconRenderMode(id: string): IconRenderMode {
	const icon = sourceIcons.get(baseIconId(id));
	return icon?.render ?? "sprite";
}

export function isComposableIcon(id: string): boolean {
	return getIconRenderMode(id) === "composable";
}

/** All icon ids from `meta.json`, sorted. */
export function listIconIds(): string[] {
	return [...sourceIcons.keys()].sort();
}

export function listSpriteIconIds(): string[] {
	return [...sourceIcons.keys()]
		.filter((id) => getIconRenderMode(id) === "sprite")
		.sort();
}

/** Composable pictogram / letter ids (suitable for module glyphs with tint). */
export function listComposableIconIds(): string[] {
	return [...sourceIcons.keys()]
		.filter((id) => getIconRenderMode(id) === "composable")
		.sort();
}

export function getIconLabel(
	id: string,
	language: "de" | "en" = "de",
): string | null {
	const icon = sourceIcons.get(baseIconId(id));
	const label = icon?.label?.[language] ?? icon?.label?.de ?? icon?.label?.en;
	return label ?? null;
}

export function getIconGroups(id: string): string[] {
	return [...(sourceIcons.get(baseIconId(id))?.groups ?? [])].sort();
}

export function getIconFallback(id: string): string | null {
	return sourceIcons.get(baseIconId(id))?.fallback ?? null;
}

export function getIconVariants(id: string): string[] {
	return [...(sourceIcons.get(baseIconId(id))?.variants ?? [])].sort();
}

export function resolveIconVariantId(id: string, variant: string): string {
	let current = baseIconId(id);
	const visited = new Set<string>();

	while (!visited.has(current)) {
		visited.add(current);

		if (getIconVariants(current).includes(variant)) {
			return current;
		}

		const fallback = getIconFallback(current);
		if (fallback === null) {
			return current;
		}

		current = fallback;
	}

	return baseIconId(id);
}
