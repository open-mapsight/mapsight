import {deepStrictEqual, strictEqual} from "node:assert";
import {readFileSync} from "node:fs";

import {test} from "vitest";

import {ACTION_MERGE, ACTION_MERGE_CONFIG} from "@/lib/base/reducer";
import {FeatureSourcesController} from "@/lib/feature-sources/controller";
import type {FeatureSourcesState} from "@/lib/feature-sources/types";

// Pass a captured, loaded runtime snapshot; do not commit customer data.
const snapshotPath = process.env.MAPSIGHT_CONFIG_BENCH_STATE;
if (!snapshotPath) {
	throw new Error("Set MAPSIGHT_CONFIG_BENCH_STATE to a captured state.json");
}
const snapshot = JSON.parse(readFileSync(snapshotPath, "utf8")) as {
	featureSources: FeatureSourcesState;
};
const controller = new FeatureSourcesController("featureSources");
const state = controller.reduce(snapshot.featureSources, {type: "initialize"});
const configKeys = [
	"type",
	"url",
	"filters",
	"doRefresh",
	"timer",
	"featureSourceNames",
	"enableHistory",
	"historyLimit",
];
// A separately parsed preset does not share its config arrays with live state.
const config = structuredClone(
	Object.fromEntries(
		Object.entries(state).map(([id, source]) => [
			id,
			Object.fromEntries(
				Object.entries(source).filter(([key]) =>
					configKeys.includes(key),
				),
			),
		]),
	),
);
const loadedIds = Object.keys(state).filter(
	(id) => state[id]?.data?.features?.length,
);
if (!loadedIds.length) {
	throw new Error(
		"Benchmark snapshot must contain loaded feature collections",
	);
}

const updates = {
	"same source config": config,
	"changed filters": Object.fromEntries(
		Object.entries(config).map(([id, source]) => [
			id,
			{...source, filters: ["benchmarkFilter"]},
		]),
	),
};

for (const [name, value] of Object.entries(updates)) {
	const action = {path: [], value};
	const legacy = controller.reduce(state, {type: ACTION_MERGE, ...action});
	const shared = controller.reduce(state, {
		type: ACTION_MERGE_CONFIG,
		...action,
	});
	deepStrictEqual(shared, legacy);
	for (const id of loadedIds) {
		strictEqual(shared[id]?.data, state[id]?.data);
		strictEqual(shared[id]?.ids, state[id]?.ids);
		strictEqual(shared[id]?.featuresById, state[id]?.featuresById);
	}
	if (value === config) {
		strictEqual(shared, state);
	}

	const legacyAction = {type: ACTION_MERGE, ...action};
	const configAction = {type: ACTION_MERGE_CONFIG, ...action};
	test(name, async ({bench}) => {
		await bench.compare(
			bench("legacy merge", () => controller.reduce(state, legacyAction)),
			bench("config merge", () => controller.reduce(state, configAction)),
			{iterations: 30, time: 0, warmupIterations: 3, warmupTime: 0},
		);
	});
}
