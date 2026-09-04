#!/usr/bin/env node
import {mkdir, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
	faBicycle,
	faBiking,
	faBolt,
	faBoxesPacking,
	faBuilding,
	faBus,
	faCar,
	faChair,
	faChargingStation,
	faCloudRain,
	faCloudShowersWater,
	faCloudSun,
	faCloudSunRain,
	faDroplet,
	faDumpster,
	faFaucetDrip,
	faGasPump,
	faGlassWaterDroplet,
	faHandHoldingDroplet,
	faHospital,
	faInfo,
	faLeaf,
	faLocationDot,
	faMugHot,
	faPersonBiking,
	faPersonShelter,
	faPersonWalking,
	faRecycle,
	faRoute,
	faSchool,
	faSeedling,
	faSkullCrossbones,
	faSnowflake,
	faTemperatureHigh,
	faTemperatureLow,
	faTowerBroadcast,
	faTree,
	faTruck,
	faTruckFast,
	faTruckRampBox,
	faUmbrella,
	faUsers,
	faUtensils,
	faVanShuttle,
	faWarehouse,
	faWater,
	faWaterLadder,
	faWifi,
} from "@fortawesome/free-solid-svg-icons";
import type {IconDefinition} from "@fortawesome/free-solid-svg-icons";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.resolve(
	scriptDir,
	"../../src/generated/pictograms/fontawesome.ts",
);

type FaIconEntry = {
	exportName: string;
	id: string;
	label: Record<string, string>;
	icon: IconDefinition;
};

const icons: FaIconEntry[] = [
	{
		exportName: "faSchool",
		id: "fa-school",
		label: {de: "Schule", en: "School"},
		icon: faSchool,
	},
	{
		exportName: "faHospital",
		id: "fa-hospital",
		label: {de: "Krankenhaus", en: "Hospital"},
		icon: faHospital,
	},
	{
		exportName: "faBolt",
		id: "fa-bolt",
		label: {de: "Energie", en: "Energy"},
		icon: faBolt,
	},
	{
		exportName: "faCar",
		id: "fa-car",
		label: {de: "Auto", en: "Car"},
		icon: faCar,
	},
	{
		exportName: "faBicycle",
		id: "fa-bicycle",
		label: {de: "Fahrrad", en: "Bicycle"},
		icon: faBicycle,
	},
	{
		exportName: "faBus",
		id: "fa-bus",
		label: {de: "Bus", en: "Bus"},
		icon: faBus,
	},
	{
		exportName: "faChargingStation",
		id: "fa-charging-station",
		label: {de: "Ladestation", en: "Charging station"},
		icon: faChargingStation,
	},
	{
		exportName: "faUtensils",
		id: "fa-utensils",
		label: {de: "Gastronomie", en: "Restaurant"},
		icon: faUtensils,
	},
	{
		exportName: "faMugHot",
		id: "fa-cafe",
		label: {de: "Café", en: "Cafe"},
		icon: faMugHot,
	},
	{
		exportName: "faTree",
		id: "fa-tree",
		label: {de: "Park", en: "Park"},
		icon: faTree,
	},
	{
		exportName: "faLocationDot",
		id: "fa-marker",
		label: {de: "Marker", en: "Marker"},
		icon: faLocationDot,
	},
	// Smart City
	{
		exportName: "faWater",
		id: "fa-water",
		label: {de: "Wasser", en: "Water"},
		icon: faWater,
	},
	{
		exportName: "faDroplet",
		id: "fa-water-lower",
		label: {de: "Niedriger Wasserstand", en: "Low water level"},
		icon: faDroplet,
	},
	{
		exportName: "faBiking",
		id: "fa-biking",
		label: {de: "Radverkehr", en: "Cycling"},
		icon: faBiking,
	},
	{
		exportName: "faUsers",
		id: "fa-users",
		label: {de: "Personen", en: "People"},
		icon: faUsers,
	},
	{
		exportName: "faVanShuttle",
		id: "fa-car-bus",
		label: {de: "Verkehr", en: "Traffic"},
		icon: faVanShuttle,
	},
	{
		exportName: "faCloudRain",
		id: "fa-cloud-rain",
		label: {de: "Regen", en: "Rain"},
		icon: faCloudRain,
	},
	{
		exportName: "faCloudSunRain",
		id: "fa-thunderstorm-sun",
		label: {de: "Gewitter", en: "Thunderstorm"},
		icon: faCloudSunRain,
	},
	{
		exportName: "faTree",
		id: "fa-tree-alt",
		label: {de: "Bäume", en: "Trees"},
		icon: faTree,
	},
	{
		exportName: "faLeaf",
		id: "fa-leaf-heart",
		label: {de: "Umwelt", en: "Environment"},
		icon: faLeaf,
	},
	{
		exportName: "faInfo",
		id: "fa-info",
		label: {de: "Info", en: "Info"},
		icon: faInfo,
	},
	{
		exportName: "faTemperatureHigh",
		id: "fa-temperature-high",
		label: {de: "Temperatur", en: "Temperature"},
		icon: faTemperatureHigh,
	},
	{
		exportName: "faPersonWalking",
		id: "fa-person-walking",
		label: {de: "Fußgänger", en: "Pedestrian"},
		icon: faPersonWalking,
	},
	{
		exportName: "faRoute",
		id: "fa-route",
		label: {de: "Route", en: "Route"},
		icon: faRoute,
	},
	{
		exportName: "faPersonBiking",
		id: "fa-person-biking",
		label: {de: "Radfahrer", en: "Cyclist"},
		icon: faPersonBiking,
	},
	{
		exportName: "faGasPump",
		id: "fa-gas-pump",
		label: {de: "Tankstelle", en: "Gas station"},
		icon: faGasPump,
	},
	{
		exportName: "faWifi",
		id: "fa-wifi",
		label: {de: "WLAN", en: "Wi-Fi"},
		icon: faWifi,
	},
	{
		exportName: "faTowerBroadcast",
		id: "fa-tower-broadcast",
		label: {de: "Funkmast", en: "Broadcast tower"},
		icon: faTowerBroadcast,
	},
	{
		exportName: "faRecycle",
		id: "fa-recycle",
		label: {de: "Recycling", en: "Recycling"},
		icon: faRecycle,
	},
	{
		exportName: "faDumpster",
		id: "fa-dumpster",
		label: {de: "Container", en: "Dumpster"},
		icon: faDumpster,
	},
	{
		exportName: "faSkullCrossbones",
		id: "fa-skull-crossbones",
		label: {de: "Gefahr", en: "Hazard"},
		icon: faSkullCrossbones,
	},
	{
		exportName: "faTruck",
		id: "fa-truck",
		label: {de: "Lkw", en: "Truck"},
		icon: faTruck,
	},
	{
		exportName: "faTruckFast",
		id: "fa-truck-fast",
		label: {de: "Schnelllieferung", en: "Express delivery"},
		icon: faTruckFast,
	},
	{
		exportName: "faTruckRampBox",
		id: "fa-truck-ramp-box",
		label: {de: "Entladung", en: "Unloading"},
		icon: faTruckRampBox,
	},
	{
		exportName: "faBoxesPacking",
		id: "fa-boxes-packing",
		label: {de: "Versand", en: "Packing"},
		icon: faBoxesPacking,
	},
	{
		exportName: "faWarehouse",
		id: "fa-warehouse",
		label: {de: "Lager", en: "Warehouse"},
		icon: faWarehouse,
	},
	{
		exportName: "faFaucetDrip",
		id: "fa-faucet-drip",
		label: {de: "Wasserhahn", en: "Faucet"},
		icon: faFaucetDrip,
	},
	{
		exportName: "faCloudShowersWater",
		id: "fa-cloud-showers-water",
		label: {de: "Starkregen", en: "Heavy rain"},
		icon: faCloudShowersWater,
	},
	{
		exportName: "faHandHoldingDroplet",
		id: "fa-hand-holding-droplet",
		label: {de: "Wasserabgabe", en: "Water supply"},
		icon: faHandHoldingDroplet,
	},
	{
		exportName: "faSeedling",
		id: "fa-seedling",
		label: {de: "Pflanze", en: "Seedling"},
		icon: faSeedling,
	},
	{
		exportName: "faTemperatureLow",
		id: "fa-temperature-low",
		label: {de: "Niedrige Temperatur", en: "Low temperature"},
		icon: faTemperatureLow,
	},
	{
		exportName: "faUmbrella",
		id: "fa-umbrella",
		label: {de: "Regenschirm", en: "Umbrella"},
		icon: faUmbrella,
	},
	{
		exportName: "faCloudSun",
		id: "fa-cloud-sun",
		label: {de: "Bewölkt", en: "Partly cloudy"},
		icon: faCloudSun,
	},
	{
		exportName: "faSnowflake",
		id: "fa-snowflake",
		label: {de: "Schnee", en: "Snowflake"},
		icon: faSnowflake,
	},
	{
		exportName: "faPersonShelter",
		id: "fa-person-shelter",
		label: {de: "Unterstand", en: "Shelter"},
		icon: faPersonShelter,
	},
	{
		exportName: "faBuilding",
		id: "fa-building",
		label: {de: "Gebäude", en: "Building"},
		icon: faBuilding,
	},
	{
		exportName: "faWaterLadder",
		id: "fa-water-ladder",
		label: {de: "Schwimmbad", en: "Swimming pool"},
		icon: faWaterLadder,
	},
	{
		exportName: "faGlassWaterDroplet",
		id: "fa-glass-water-droplet",
		label: {de: "Trinkwasser", en: "Drinking water"},
		icon: faGlassWaterDroplet,
	},
	{
		exportName: "faChair",
		id: "fa-chair",
		label: {de: "Sitzplatz", en: "Chair"},
		icon: faChair,
	},
];

function iconToMarkup(icon: IconDefinition): {viewBox: string; markup: string} {
	const [width, height, , , pathData] = icon.icon;
	const paths = Array.isArray(pathData) ? pathData : [pathData];
	const markup = paths
		.map((d) => `<path fill="currentColor" d="${d}"/>`)
		.join("");
	return {
		viewBox: `0 0 ${width} ${height}`,
		markup,
	};
}

const lines = [
	'import type {PictogramDefinition} from "../../lib/pictograms/types.ts";',
	"",
	"/** Generated by scripts/dev/import-fontawesome.ts — do not edit manually. */",
	"export const fontAwesomePictograms: PictogramDefinition[] = [",
];

for (const entry of icons) {
	const {viewBox, markup} = iconToMarkup(entry.icon);
	lines.push("\t{");
	lines.push(`\t\tid: ${JSON.stringify(entry.id)},`);
	lines.push(`\t\tlabel: ${JSON.stringify(entry.label)},`);
	lines.push(`\t\tviewBox: ${JSON.stringify(viewBox)},`);
	lines.push('\t\tsource: "fontawesome",');
	lines.push(`\t\tmarkup: ${JSON.stringify(markup)},`);
	lines.push("\t},");
}

lines.push("];", "");

await mkdir(path.dirname(outputPath), {recursive: true});
await writeFile(outputPath, lines.join("\n"), "utf-8");
console.log(`Wrote ${icons.length} Font Awesome pictograms to ${outputPath}`);
