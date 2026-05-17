import type {Extent} from "ol/extent";
import type TileGrid from "ol/tilegrid/TileGrid";

import {
	assertNonNullable,
	ensureNonNullable,
} from "@mapsight/lib-js/nonNullable";

export default function getTileUrlsForExtent(
	tileGrid: TileGrid,
	extent: Extent,
) {
	assertNonNullable(extent[0]);
	assertNonNullable(extent[1]);
	assertNonNullable(extent[2]);
	assertNonNullable(extent[3]);

	const tileUrls: Array<string> = [];
	for (let z = 17; z <= 21; z++) {
		const leftBottom = tileGrid.getTileCoordForCoordAndZ(
			[extent[0], extent[1]],
			z,
		);
		const left = ensureNonNullable(leftBottom[1]);
		const bottom = -ensureNonNullable(leftBottom[2]);

		const rightTop = tileGrid.getTileCoordForCoordAndZ(
			[extent[2], extent[3]],
			z,
		);
		const right = ensureNonNullable(rightTop[1]);
		const top = -ensureNonNullable(rightTop[2]);

		for (let x = left; x <= right; x += 1) {
			for (let y = top; y <= bottom; y += 1) {
				tileUrls.push(`${z}/${x}/${y}.png`);
			}
		}
	}
	return tileUrls;
}
