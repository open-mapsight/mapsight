import type {IconVariant} from "../icon/icon-id.ts";
import {listPictogramIds} from "../pictograms/index.ts";
import type {IconCache} from "./cache.ts";
import {defaultIconCache} from "./cache.ts";

export type MapsightIconTarget = {
	mapsightIconId: string;
	variant: IconVariant;
};

export function buildCatalogTargets(options?: {
	variants?: IconVariant[];
	pictogramIds?: string[];
}): MapsightIconTarget[] {
	const variants = options?.variants ?? ["plain", "default"];
	const pictogramIds = options?.pictogramIds ?? listPictogramIds();
	const targets: MapsightIconTarget[] = [];

	for (const pictogram of pictogramIds) {
		for (const variant of variants) {
			targets.push({
				mapsightIconId: pictogram,
				variant,
			});
		}
	}

	for (const letter of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
		targets.push({mapsightIconId: letter, variant: "plain"});
	}

	return targets;
}

export async function prewarmCatalog(
	cache: IconCache = defaultIconCache,
	targets?: MapsightIconTarget[],
): Promise<number> {
	const items = targets ?? buildCatalogTargets();
	await Promise.all(
		items.map(({mapsightIconId, variant}) =>
			cache.get(mapsightIconId, variant),
		),
	);
	return items.length;
}
