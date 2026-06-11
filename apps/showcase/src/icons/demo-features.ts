import {formatMapsightIcon} from "@mapsight/traffic-style/runtime-dev";

export type DemoIconKind = "sprite" | "runtime-default" | "runtime-colored";

export type DemoMapFeature = {
	id: string;
	title: string;
	kind: DemoIconKind;
	coordinates: [number, number];
	mapsightIconId: string;
};

export const demoMapFeatures: DemoMapFeature[] = [
	{
		id: "stau",
		title: "Stau",
		kind: "sprite",
		coordinates: [10.512, 52.268],
		mapsightIconId: "stau",
	},
	{
		id: "ampel",
		title: "Ampel",
		kind: "sprite",
		coordinates: [10.518, 52.266],
		mapsightIconId: "ampel",
	},
	{
		id: "baustelle",
		title: "Baustelle",
		kind: "sprite",
		coordinates: [10.524, 52.264],
		mapsightIconId: "baustelle",
	},
	{
		id: "museum-default-id",
		title: "Museum",
		kind: "runtime-default",
		coordinates: [10.53, 52.269],
		mapsightIconId: "museum",
	},
	{
		id: "charging-default",
		title: "Charging station",
		kind: "runtime-default",
		coordinates: [10.536, 52.267],
		mapsightIconId: "charging-station",
	},
	{
		id: "library-default",
		title: "Library",
		kind: "runtime-default",
		coordinates: [10.528, 52.262],
		mapsightIconId: "bilbiothek_archiv",
	},
	{
		id: "museum-colored",
		title: "Museum",
		kind: "runtime-colored",
		coordinates: [10.522, 52.271],
		mapsightIconId: "museum/#be123c",
	},
	{
		id: "charging-colored",
		title: "Charging station",
		kind: "runtime-colored",
		coordinates: [10.534, 52.263],
		mapsightIconId: "charging-station/#059669/#ffffff",
	},
	{
		id: "school-colored",
		title: "School",
		kind: "runtime-colored",
		coordinates: [10.526, 52.259],
		mapsightIconId: "fa-school/#1d4ed8/#ffffff",
	},
];

export const demoIconKindLabels: Record<DemoIconKind, string> = {
	sprite: "Sprite sheet",
	"runtime-default": "Runtime (default colors)",
	"runtime-colored": "Runtime (custom colors)",
};

export {formatMapsightIcon};
