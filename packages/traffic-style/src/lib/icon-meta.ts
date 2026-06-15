import meta from "../meta.json" with {type: "json"};

export type IconRenderMode = "sprite" | "composable";

type SourceMetaIcon = {
	fallback?: string;
	id?: string;
	groups?: string[];
	render?: IconRenderMode;
	variants?: string[];
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

export function getIconRenderMode(id: string): IconRenderMode {
	const baseId = id.split("/")[0]!;
	const icon = sourceIcons.get(baseId);
	return icon?.render ?? "sprite";
}

export function isComposableIcon(id: string): boolean {
	return getIconRenderMode(id) === "composable";
}

export function listSpriteIconIds(): string[] {
	return [...sourceIcons.keys()]
		.filter((id) => getIconRenderMode(id) === "sprite")
		.sort();
}

export function getIconGroups(id: string): string[] {
	const baseId = id.split("/")[0]!;
	return [...(sourceIcons.get(baseId)?.groups ?? [])].sort();
}

export function getIconFallback(id: string): string | null {
	const baseId = id.split("/")[0]!;
	return sourceIcons.get(baseId)?.fallback ?? null;
}

export function getIconVariants(id: string): string[] {
	const baseId = id.split("/")[0]!;
	return [...(sourceIcons.get(baseId)?.variants ?? [])].sort();
}

export function resolveIconVariantId(id: string, variant: string): string {
	let current = id.split("/")[0]!;
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

	return id.split("/")[0]!;
}
