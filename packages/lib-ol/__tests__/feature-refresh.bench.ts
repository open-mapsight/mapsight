/**
 * Benchmarks the polling refresh pipeline (xhrJsonRefreshing sources) on live
 * Braunschweig data: JSON.parse → GeoJSON.readFeatures → update-in-source,
 * with an identical payload — the common case for 60s polls.
 *
 * The update step mirrors @mapsight/core's `updateFeaturesInSource` /
 * `modifyFeature` (core depends on lib-ol, so it cannot be imported here).
 * Strategies:
 *
 * - baseline          historical behavior before the refresh-churn fixes:
 *                     applies every key and diffs geometry by reference, so
 *                     readFeatures' new Geometry objects always re-set
 * - geometry-aware    skip the geometry set when flat coordinates are equal
 * - core-keys         geometry-aware + diff only core/style keys
 * - text-skip         compare the raw response text and skip everything
 */
import type Feature from "ol/Feature.js";
import GeoJSON from "ol/format/GeoJSON.js";
import VectorSource from "ol/source/Vector.js";

import geometriesEqual from "../src/js/geometry/geometriesEqual.ts";
import {CACHE_DIR, loadUnionCollection} from "./feature-properties/datasets.ts";
import {DEFAULT_CORE_PROPERTY_KEYS} from "./feature-properties/learnable-feature.ts";

type UpdateStrategy = "baseline" | "core-keys" | "geometry-aware";

type RefreshCounters = {
	changedFeatures: number;
	geometryReplacements: number;
	sourceChangeFeatureEvents: number;
};

type PhaseTotals = {
	parseMs: number;
	readMs: number;
	updateMs: number;
};

const ROUNDS = Number(process.env.BENCH_REFRESH_ROUNDS || 5);
const REFRESH = process.env.BENCH_PROPERTIES_REFRESH === "1";
const CORE_KEYS = new Set<string>(DEFAULT_CORE_PROPERTY_KEYS);
const geoJsonFormat = new GeoJSON();

/** Mirrors core's modifyFeature with optional geometry/key-subset awareness. */
function modifyFeature(
	baseFeature: Feature,
	newProps: Record<string, unknown>,
	strategy: UpdateStrategy,
	counters: RefreshCounters,
): boolean {
	const oldProps = baseFeature.getProperties();

	let featureChanged = false;
	let geometryChanged = false;
	for (const key of Object.keys(newProps)) {
		if (
			strategy === "core-keys" &&
			key !== "geometry" &&
			!CORE_KEYS.has(key)
		) {
			continue;
		}

		const newValue = newProps[key];
		if (oldProps[key] === newValue) {
			continue;
		}

		if (key === "geometry") {
			if (
				strategy !== "baseline" &&
				geometriesEqual(oldProps[key], newValue)
			) {
				continue;
			}
			counters.geometryReplacements += 1;
			geometryChanged = true;
		}

		featureChanged = true;
		baseFeature.set(key, newValue, key !== "geometry");
	}

	if (featureChanged) {
		counters.changedFeatures += 1;
		// The non-silent geometry set already dispatched the change event, so
		// only silent key updates need the extra changed() — mirroring core.
		if (!geometryChanged) {
			baseFeature.changed();
		}
	}
	return featureChanged;
}

/** Mirrors core's updateFeaturesInSource (public addFeature instead of internal). */
function updateFeaturesInSource(
	source: VectorSource,
	nextFeatures: Feature[],
	strategy: UpdateStrategy,
	counters: RefreshCounters,
): void {
	const ids = new Set<string>();
	for (const feature of source.getFeatures()) {
		const id = feature.getId();
		if (id !== undefined) {
			ids.add(String(id));
		} else {
			source.removeFeature(feature);
		}
	}

	let hasChanged = false;
	for (const nextFeature of nextFeatures) {
		const rawId = nextFeature.getId();
		const newId = rawId === undefined ? undefined : String(rawId);
		if (newId !== undefined && ids.has(newId)) {
			ids.delete(newId);
			const prevFeature = source.getFeatureById(newId);
			if (prevFeature) {
				if (
					modifyFeature(
						prevFeature,
						nextFeature.getProperties(),
						strategy,
						counters,
					)
				) {
					hasChanged = true;
				}
				continue;
			}
		}

		hasChanged = true;
		source.addFeature(nextFeature);
	}

	for (const id of ids) {
		const oldFeature = source.getFeatureById(id);
		if (oldFeature) {
			source.removeFeature(oldFeature);
			hasChanged = true;
		}
	}

	if (hasChanged) {
		source.changed();
	}
}

function createPopulatedSource(text: string): {
	counters: RefreshCounters;
	source: VectorSource;
} {
	const source = new VectorSource();
	source.addFeatures(geoJsonFormat.readFeatures(JSON.parse(text)));

	const counters: RefreshCounters = {
		changedFeatures: 0,
		geometryReplacements: 0,
		sourceChangeFeatureEvents: 0,
	};
	source.on("changefeature", () => {
		counters.sourceChangeFeatureEvents += 1;
	});

	return {counters, source};
}

function runUpdateStrategy(
	label: string,
	text: string,
	featureCount: number,
	strategy: UpdateStrategy,
): void {
	const {counters, source} = createPopulatedSource(text);
	const totals: PhaseTotals = {parseMs: 0, readMs: 0, updateMs: 0};

	for (let round = 0; round < ROUNDS; round += 1) {
		const parseStart = performance.now();
		const parsed = JSON.parse(text) as object;
		const readStart = performance.now();
		const nextFeatures = geoJsonFormat.readFeatures(parsed);
		const updateStart = performance.now();
		updateFeaturesInSource(source, nextFeatures, strategy, counters);
		const end = performance.now();

		totals.parseMs += readStart - parseStart;
		totals.readMs += updateStart - readStart;
		totals.updateMs += end - updateStart;
	}

	const perRound = (value: number) => (value / ROUNDS).toFixed(2);
	console.log(
		`  ${label.padEnd(16)} parse ${perRound(totals.parseMs).padStart(7)}ms  read ${perRound(totals.readMs).padStart(7)}ms  update ${perRound(totals.updateMs).padStart(7)}ms  | per refresh: changed=${counters.changedFeatures / ROUNDS}/${featureCount}  geomSets=${counters.geometryReplacements / ROUNDS}  sourceEvents=${counters.sourceChangeFeatureEvents / ROUNDS}`,
	);
}

function runTextSkip(text: string): void {
	// Each poll response arrives as a fresh string object. Pre-create
	// independent flat copies so the timed loop measures only the equality
	// compare, not the per-round allocation of a fresh string.
	const responses: string[] = [];
	for (let round = 0; round <= ROUNDS; round += 1) {
		responses.push(Buffer.from(text, "utf8").toString("utf8"));
	}

	let skipped = 0;
	const start = performance.now();
	for (let round = 1; round <= ROUNDS; round += 1) {
		if (responses[round] === responses[round - 1]) {
			skipped += 1;
		}
	}
	const ms = (performance.now() - start) / ROUNDS;

	console.log(
		`  ${"text-skip".padEnd(16)} compare ${ms.toFixed(2).padStart(5)}ms/refresh (${(text.length / 1024 / 1024).toFixed(1)}MB text)  skipped=${skipped}/${ROUNDS}  | changed=0 geomSets=0 sourceEvents=0`,
	);
}

function benchCopyStrategies(bags: Array<Record<string, unknown>>): void {
	const cases: Array<{
		fn: (bag: Record<string, unknown>) => unknown;
		label: string;
	}> = [
		{fn: (bag) => ({...bag}), label: "{...props} shallow spread"},
		{fn: (bag) => structuredClone(bag), label: "structuredClone (deep)"},
		{
			fn: (bag) => JSON.parse(JSON.stringify(bag)) as unknown,
			label: "JSON roundtrip (deep)",
		},
	];

	for (const {fn, label} of cases) {
		for (const bag of bags) {
			fn(bag);
		}

		const start = performance.now();
		for (let round = 0; round < 5; round += 1) {
			for (const bag of bags) {
				fn(bag);
			}
		}
		const ms = (performance.now() - start) / 5;
		const perFeatureUs = (ms * 1000) / bags.length;

		console.log(
			`  ${label.padEnd(28)} ${ms.toFixed(2).padStart(8)}ms/pass  ${perFeatureUs.toFixed(2).padStart(7)}µs/feature`,
		);
	}
}

async function main(): Promise<void> {
	const {union} = await loadUnionCollection(REFRESH);
	const text = JSON.stringify(union);
	const featureCount = union.features?.length ?? 0;

	console.log(
		`Braunschweig refresh-pipeline bench (identical payload, ${featureCount} features, ${(text.length / 1024 / 1024).toFixed(1)}MB, ${ROUNDS} rounds, cache ${CACHE_DIR})\n`,
	);

	console.log(
		"Identical-payload poll: per-refresh cost and change churn (lower is better)",
	);
	runUpdateStrategy("baseline", text, featureCount, "baseline");
	runUpdateStrategy("geometry-aware", text, featureCount, "geometry-aware");
	runUpdateStrategy("core-keys", text, featureCount, "core-keys");
	runTextSkip(text);

	const bags = (union.features ?? [])
		.map((feature) => feature.properties)
		.filter(
			(properties): properties is Record<string, unknown> =>
				properties != null,
		);

	console.log("\nProperty-bag copy strategies (whole union per pass)");
	benchCopyStrategies(bags);
}

await main();
