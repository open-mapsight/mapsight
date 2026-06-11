import meta from "../meta.json" with {type: "json"};

export type IconRenderMode = "sprite" | "composable";

type SourceMetaIcon = {
	render?: IconRenderMode;
};

type SourceMeta = {
	icons?: Record<string, SourceMetaIcon>;
};

const sourceMeta = meta as SourceMeta;

export function getIconRenderMode(id: string): IconRenderMode {
	const icon = sourceMeta.icons?.[id];
	return icon?.render ?? "sprite";
}

export function isComposableIcon(id: string): boolean {
	return getIconRenderMode(id) === "composable";
}

export function listSpriteIconIds(): string[] {
	const icons = sourceMeta.icons ?? {};
	return Object.keys(icons)
		.filter((id) => getIconRenderMode(id) === "sprite")
		.sort();
}
