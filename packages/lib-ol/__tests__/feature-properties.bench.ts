import Feature from "ol/Feature.js";
import GeoJSON from "ol/format/GeoJSON.js";

import {createPropsFilter} from "../src/js/style/styleFunction.ts";
import type {GeoJsonCollection} from "./feature-properties/datasets.ts";
import {CACHE_DIR, loadUnionCollection} from "./feature-properties/datasets.ts";
import LearnableFeature, {
	DEFAULT_CORE_PROPERTY_KEYS,
} from "./feature-properties/learnable-feature.ts";

type AccessStrategy =
	| "get-allowed-keys"
	| "get-miss-description"
	| "get-properties"
	| "get-properties-internal"
	| "modify-full"
	| "modify-filtered"
	| "style-hash-filter"
	| "style-hash-internal"
	| "style-hash-get-keys"
	| "clone";

type IngestStrategy =
	"filtered-ingest" | "full-copy" | "learnable-promote" | "learnable-warn";

type PreparedFeature = {
	feature: Feature;
	properties: Record<string, unknown>;
};

const CORE_KEYS = [...DEFAULT_CORE_PROPERTY_KEYS];
const STYLE_ALLOWED_PROPS = [
	"chargingPower",
	"id",
	"mapsightIconId",
	"markerCaption",
	"markerCaptionColor",
	"name",
	"occupancyTrendString",
	"state",
	"title",
	"type",
] as const;
const REFRESH = process.env.BENCH_PROPERTIES_REFRESH === "1";
const DATASET_FILTER = new Set(
	(process.env.BENCH_PROPERTIES_DATASETS ?? "")
		.split(",")
		.map((value) => value.trim())
		.filter(Boolean),
);
const filterStyleProps = createPropsFilter([...STYLE_ALLOWED_PROPS]);
const geoJsonFormat = new GeoJSON();

function jsonBytes(value: unknown): number {
	return Buffer.byteLength(JSON.stringify(value ?? null));
}

function pickCoreProperties(
	properties: Record<string, unknown>,
): Record<string, unknown> {
	const picked: Record<string, unknown> = {};
	for (const key of CORE_KEYS) {
		if (Object.hasOwn(properties, key)) {
			picked[key] = properties[key];
		}
	}
	return picked;
}

function collectGc(): void {
	if (typeof globalThis.gc === "function") {
		globalThis.gc();
	}
}

function readHeapUsed(): number {
	return process.memoryUsage().heapUsed;
}

function analyzeCollection(id: string, collection: GeoJsonCollection): void {
	const features = collection.features ?? [];
	const keyCount = new Map<string, number>();
	const keyBytes = new Map<string, number>();
	let propertyBytes = 0;
	let geometryBytes = 0;
	let corePropertyBytes = 0;

	for (const feature of features) {
		const properties = feature.properties ?? {};
		propertyBytes += jsonBytes(properties);
		geometryBytes += jsonBytes(feature.geometry);
		corePropertyBytes += jsonBytes(pickCoreProperties(properties));

		for (const [key, value] of Object.entries(properties)) {
			keyCount.set(key, (keyCount.get(key) ?? 0) + 1);
			keyBytes.set(key, (keyBytes.get(key) ?? 0) + jsonBytes(value));
		}
	}

	const keys = [...keyBytes.entries()].sort(
		(left, right) => right[1] - left[1],
	);
	const descriptionShare =
		propertyBytes === 0
			? 0
			: ((keyBytes.get("description") ?? 0) / propertyBytes) * 100;

	console.log(`\n${id}`);
	console.log(
		`  features=${features.length}  props=${(propertyBytes / 1024).toFixed(1)}KB  geom=${(geometryBytes / 1024).toFixed(1)}KB  core-subset=${(corePropertyBytes / 1024).toFixed(1)}KB  description=${descriptionShare.toFixed(0)}%`,
	);
	console.log(
		`  keys: ${keys
			.slice(0, 8)
			.map(
				([key, bytes]) =>
					`${key}×${keyCount.get(key) ?? 0} ${(bytes / 1024).toFixed(1)}KB`,
			)
			.join(" · ")}`,
	);
}

function readOlFeatures(collection: GeoJsonCollection): Feature[] {
	return geoJsonFormat.readFeatures(collection);
}

function createPrepared(
	olFeatures: Feature[],
	ingest: IngestStrategy,
): PreparedFeature[] {
	const missCounts = new Map<string, number>();
	const onMiss = (key: string) => {
		missCounts.set(key, (missCounts.get(key) ?? 0) + 1);
	};

	return olFeatures.map((source) => {
		const properties = {...source.getProperties()};
		delete properties.geometry;
		const geometry = source.getGeometry();
		const id = source.getId();

		let feature: Feature;
		if (ingest === "full-copy") {
			feature = new Feature();
			if (geometry) {
				feature.setGeometry(geometry);
			}
			feature.setProperties(properties, true);
		} else if (ingest === "filtered-ingest") {
			feature = new Feature();
			if (geometry) {
				feature.setGeometry(geometry);
			}
			feature.setProperties(pickCoreProperties(properties), true);
		} else {
			feature = new LearnableFeature(undefined, {
				coreKeys: CORE_KEYS,
				onMiss,
				promoteOnMiss: ingest === "learnable-promote",
			});
			if (geometry) {
				feature.setGeometry(geometry);
			}
			feature.setProperties(properties, true);
		}

		if (id !== undefined) {
			feature.setId(id);
		}

		return {feature, properties};
	});
}

function captionForUpdate(properties: Record<string, unknown>): string {
	const caption = properties.markerCaption;
	return typeof caption === "string" || typeof caption === "number"
		? String(caption)
		: "x";
}

function getPropertiesInternal(feature: Feature) {
	return feature.getPropertiesInternal();
}

function modifyFeature(
	feature: Feature,
	nextProperties: Record<string, unknown>,
): void {
	const previous = feature.getProperties();
	let changed = false;

	for (const key of Object.keys(nextProperties)) {
		const nextValue = nextProperties[key];
		if (previous[key] !== nextValue) {
			feature.set(key, nextValue, key !== "geometry");
			changed = true;
		}
	}

	if (changed) {
		feature.changed();
	}
}

function runAccess(
	prepared: PreparedFeature[],
	access: AccessStrategy,
): number {
	let touched = 0;

	for (const {feature, properties} of prepared) {
		switch (access) {
			case "get-properties": {
				touched += Object.keys(feature.getProperties()).length;
				break;
			}
			case "get-properties-internal": {
				const internal = getPropertiesInternal(feature);
				touched += internal ? Object.keys(internal).length : 0;
				break;
			}
			case "get-allowed-keys": {
				for (const key of STYLE_ALLOWED_PROPS) {
					if (feature.get(key) != null) {
						touched += 1;
					}
				}
				break;
			}
			case "get-miss-description": {
				if (feature.get("description") != null) {
					touched += 1;
				}
				break;
			}
			case "style-hash-filter": {
				const filtered = filterStyleProps(feature.getProperties());
				touched += JSON.stringify(filtered).length;
				break;
			}
			case "style-hash-internal": {
				const filtered = filterStyleProps(
					getPropertiesInternal(feature) ?? {},
				);
				touched += JSON.stringify(filtered).length;
				break;
			}
			case "style-hash-get-keys": {
				const picked: Record<string, unknown> = {};
				for (const key of STYLE_ALLOWED_PROPS) {
					const value = feature.get(key);
					if (value != null) {
						picked[key] = value;
					}
				}
				touched += JSON.stringify(picked).length;
				break;
			}
			case "modify-full": {
				modifyFeature(feature, {
					...properties,
					markerCaption: captionForUpdate(properties),
				});
				touched += 1;
				break;
			}
			case "modify-filtered": {
				modifyFeature(feature, {
					...pickCoreProperties(properties),
					markerCaption: captionForUpdate(properties),
				});
				touched += 1;
				break;
			}
			case "clone": {
				touched += Object.keys(feature.clone().getProperties()).length;
				break;
			}
		}
	}

	return touched;
}

function benchAccess(
	label: string,
	prepared: PreparedFeature[],
	access: AccessStrategy,
	rounds: number,
): {ms: number; perFeatureUs: number} {
	runAccess(prepared, access);

	const start = performance.now();
	for (let round = 0; round < rounds; round += 1) {
		runAccess(prepared, access);
	}
	const ms = performance.now() - start;
	const perFeatureUs = (ms * 1000) / (rounds * prepared.length);

	console.log(
		`  ${label.padEnd(42)} ${ms.toFixed(2).padStart(8)}ms  ${perFeatureUs.toFixed(2).padStart(8)}µs/feature  ×${rounds}`,
	);

	return {ms, perFeatureUs};
}

function benchHeap(
	label: string,
	factory: () => PreparedFeature[],
): PreparedFeature[] {
	collectGc();
	const before = readHeapUsed();
	const prepared = factory();
	collectGc();
	const after = readHeapUsed();
	const bytesPerFeature = (after - before) / Math.max(prepared.length, 1);

	console.log(
		`  ${label.padEnd(42)} ${((after - before) / 1024 / 1024).toFixed(2).padStart(8)}MB  ${bytesPerFeature.toFixed(0).padStart(8)}B/feature  n=${prepared.length}`,
	);

	return prepared;
}

async function main(): Promise<void> {
	console.log(
		"Braunschweig live property-storage bench\n" +
			`(cache ${CACHE_DIR}${REFRESH ? ", refresh forced" : ""})`,
	);
	if (typeof globalThis.gc !== "function") {
		console.log(
			"Note: restart with `node --expose-gc` for tighter heap deltas.\n",
		);
	}

	const {loaded, union: allCollection} = await loadUnionCollection(
		REFRESH,
		DATASET_FILTER,
	);
	for (const {id, collection} of loaded) {
		analyzeCollection(id, collection);
	}
	analyzeCollection("all-live (union)", allCollection);

	const olFeatures = readOlFeatures(allCollection);
	const ingestStrategies: IngestStrategy[] = [
		"full-copy",
		"filtered-ingest",
		"learnable-warn",
		"learnable-promote",
	];

	console.log("\nHeap after ingest (keep references)");
	const preparedByIngest = new Map<IngestStrategy, PreparedFeature[]>();
	for (const ingest of ingestStrategies) {
		preparedByIngest.set(
			ingest,
			benchHeap(ingest, () => createPrepared(olFeatures, ingest)),
		);
	}

	const accessCases: Array<{
		access: AccessStrategy;
		ingest: IngestStrategy;
		label: string;
		rounds: number;
	}> = [
		{
			access: "get-properties",
			ingest: "full-copy",
			label: "getProperties / full-copy",
			rounds: 40,
		},
		{
			access: "get-properties-internal",
			ingest: "full-copy",
			label: "getPropertiesInternal / full-copy",
			rounds: 40,
		},
		{
			access: "get-properties",
			ingest: "filtered-ingest",
			label: "getProperties / filtered-ingest",
			rounds: 40,
		},
		{
			access: "get-properties",
			ingest: "learnable-warn",
			label: "getProperties / learnable-warn",
			rounds: 40,
		},
		{
			access: "get-allowed-keys",
			ingest: "full-copy",
			label: "get(allowed) / full-copy",
			rounds: 40,
		},
		{
			access: "get-allowed-keys",
			ingest: "learnable-warn",
			label: "get(allowed) / learnable-warn",
			rounds: 40,
		},
		{
			access: "get-miss-description",
			ingest: "full-copy",
			label: "get(description) / full-copy",
			rounds: 20,
		},
		{
			access: "get-miss-description",
			ingest: "filtered-ingest",
			label: "get(description) / filtered-ingest",
			rounds: 20,
		},
		{
			access: "get-miss-description",
			ingest: "learnable-warn",
			label: "get(description) / learnable-warn",
			rounds: 20,
		},
		{
			access: "get-miss-description",
			ingest: "learnable-promote",
			label: "get(description) / learnable-promote",
			rounds: 20,
		},
		{
			access: "style-hash-filter",
			ingest: "full-copy",
			label: "style hash(getProperties) / full-copy",
			rounds: 20,
		},
		{
			access: "style-hash-filter",
			ingest: "filtered-ingest",
			label: "style hash(getProperties) / filtered",
			rounds: 20,
		},
		{
			access: "style-hash-filter",
			ingest: "learnable-warn",
			label: "style hash(getProperties) / learnable",
			rounds: 20,
		},
		{
			access: "style-hash-internal",
			ingest: "full-copy",
			label: "style hash(internal) / full-copy",
			rounds: 20,
		},
		{
			access: "style-hash-get-keys",
			ingest: "learnable-warn",
			label: "style hash(get keys) / learnable",
			rounds: 20,
		},
		{
			access: "modify-full",
			ingest: "full-copy",
			label: "modifyFeature(all keys) / full-copy",
			rounds: 8,
		},
		{
			access: "modify-filtered",
			ingest: "full-copy",
			label: "modifyFeature(core keys) / full-copy",
			rounds: 8,
		},
		{
			access: "modify-filtered",
			ingest: "learnable-warn",
			label: "modifyFeature(core keys) / learnable",
			rounds: 8,
		},
		{
			access: "clone",
			ingest: "full-copy",
			label: "clone / full-copy",
			rounds: 6,
		},
		{
			access: "clone",
			ingest: "filtered-ingest",
			label: "clone / filtered-ingest",
			rounds: 6,
		},
		{
			access: "clone",
			ingest: "learnable-warn",
			label: "clone / learnable-warn",
			rounds: 6,
		},
	];

	console.log("\nAccess / update (lower is better)");
	for (const {access, ingest, label, rounds} of accessCases) {
		const prepared = preparedByIngest.get(ingest);
		if (!prepared) {
			continue;
		}
		benchAccess(label, prepared, access, rounds);
	}

	console.log("\nLearnable miss log from the promote heap sample:");
	const promoteSample =
		preparedByIngest.get("learnable-promote")?.[0]?.feature;
	if (promoteSample instanceof LearnableFeature) {
		console.log(
			`  first feature local keys after promote-path benches: ${Object.keys(
				promoteSample.getProperties(),
			)
				.filter((key) => key !== "geometry")
				.join(", ")}`,
		);
	}
}

await main();
