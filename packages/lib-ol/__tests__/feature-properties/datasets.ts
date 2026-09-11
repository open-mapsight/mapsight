import {mkdir, readFile, stat, writeFile} from "node:fs/promises";
import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";

export type DatasetId =
	| "charging-stations"
	| "kultur"
	| "oepnv-stop-groups"
	| "parken"
	| "parkhaeuser"
	| "sehenswuerdigkeiten"
	| "smart-city"
	| "top-sights"
	| "traffic"
	| "traffic-messages";

export type DatasetSpec = {
	id: DatasetId;
	url: string;
};

export type GeoJsonFeature = {
	geometry?: unknown;
	id?: string | number;
	properties?: Record<string, unknown> | null;
	type?: string;
};

export type GeoJsonCollection = {
	features?: GeoJsonFeature[];
	type?: string;
};

const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

export const CACHE_DIR = join(PACKAGE_ROOT, "tmp", "braunschweig-geojson");

const USER_AGENT = "mapsight-property-bench/1.0";

export const DATASETS: DatasetSpec[] = [
	{
		id: "charging-stations",
		url: "https://www.braunschweig.de/mapsight/pulp/result/charging-stations.geojson",
	},
	{
		id: "oepnv-stop-groups",
		url: "https://www.braunschweig.de/mapsight/pulp/result/oepnv-stop-groups.geojson",
	},
	{
		id: "sehenswuerdigkeiten",
		url: "https://www.braunschweig.de/geojson/sehenswuerdigkeiten.geojson",
	},
	{
		id: "smart-city",
		url: "https://www.braunschweig.de/mapsight/pulp/result/smart-city.geojson",
	},
	{
		id: "traffic",
		url: "https://www.braunschweig.de/mapsight/pulp/result/traffic.geojson",
	},
	{
		id: "kultur",
		url: "https://www.braunschweig.de/mapsight/pulp/result/kultur.geojson",
	},
	{
		id: "parken",
		url: "https://www.braunschweig.de/mapsight/pulp/result/parken.geojson",
	},
	{
		id: "traffic-messages",
		url: "https://www.braunschweig.de/mapsight/pulp/result/traffic-messages.geojson",
	},
	{
		id: "parkhaeuser",
		url: "https://www.braunschweig.de/mapsight/pulp/result/parkhaeuser.geojson",
	},
	{
		id: "top-sights",
		url: "https://www.braunschweig.de/geojson/top-sights.geojson",
	},
];

async function fileExists(path: string): Promise<boolean> {
	try {
		await stat(path);
		return true;
	} catch {
		return false;
	}
}

export async function loadDataset(
	spec: DatasetSpec,
	refresh = false,
): Promise<GeoJsonCollection> {
	await mkdir(CACHE_DIR, {recursive: true});
	const cachePath = join(CACHE_DIR, `${spec.id}.geojson`);

	if (!refresh && (await fileExists(cachePath))) {
		return JSON.parse(
			await readFile(cachePath, "utf8"),
		) as GeoJsonCollection;
	}

	const response = await fetch(spec.url, {
		headers: {
			Accept: "application/geo+json,application/json",
			"User-Agent": USER_AGENT,
		},
	});
	if (!response.ok) {
		throw new Error(`Failed to fetch ${spec.url}: HTTP ${response.status}`);
	}

	const text = await response.text();
	JSON.parse(text);
	await writeFile(cachePath, text);
	return JSON.parse(text) as GeoJsonCollection;
}

/** Union FeatureCollection of the given datasets (all by default). */
export async function loadUnionCollection(
	refresh = false,
	filterIds?: ReadonlySet<string>,
): Promise<{
	loaded: Array<{collection: GeoJsonCollection; id: DatasetId}>;
	union: GeoJsonCollection;
}> {
	const specs = filterIds?.size
		? DATASETS.filter((spec) => filterIds.has(spec.id))
		: DATASETS;

	const loaded: Array<{collection: GeoJsonCollection; id: DatasetId}> = [];
	for (const spec of specs) {
		loaded.push({
			collection: await loadDataset(spec, refresh),
			id: spec.id,
		});
	}

	return {
		loaded,
		union: {
			features: loaded.flatMap(
				({collection}) => collection.features ?? [],
			),
			type: "FeatureCollection",
		},
	};
}
