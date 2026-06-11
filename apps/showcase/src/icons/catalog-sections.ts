import {listSpriteIconIds} from "@mapsight/traffic-style/icon-meta";
import {listPictogramIdsBySource} from "@mapsight/traffic-style/runtime-dev";

export type CatalogSectionKind = "prebuilt" | "runtime";

export type CatalogSection = {
	id: string;
	title: string;
	description: string;
	kind: CatalogSectionKind;
	ids: string[];
};

const prebuiltIds = listSpriteIconIds();
const trafficStyleIds = listPictogramIdsBySource("traffic-style");
const fontAwesomeIds = listPictogramIdsBySource("fontawesome");

export const catalogSections: CatalogSection[] = [
	{
		id: "prebuilt",
		title: "Prebuilt",
		description:
			"Pixel-perfect traffic icons from the sprite sheet — not composed at runtime.",
		kind: "prebuilt",
		ids: prebuiltIds,
	},
	{
		id: "traffic-style",
		title: "Traffic-style pictograms",
		description:
			"Glyph-only POI pictograms composed at runtime with backgrounds and variants.",
		kind: "runtime",
		ids: trafficStyleIds,
	},
	{
		id: "fontawesome",
		title: "Font Awesome pictograms",
		description:
			"Imported Font Awesome glyphs composed at runtime with the same POI templates.",
		kind: "runtime",
		ids: fontAwesomeIds,
	},
];

export const catalogIconCount = catalogSections.reduce(
	(total, section) => total + section.ids.length,
	0,
);
