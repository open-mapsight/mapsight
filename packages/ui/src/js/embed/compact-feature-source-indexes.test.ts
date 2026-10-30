import {afterEach, describe, expect, it, vi} from "vitest";

import {merge} from "@mapsight/core/lib/base/actions";
import {
	redo,
	undo,
	updateFeatureProperty,
} from "@mapsight/core/lib/feature-sources/actions";
import {
	createFilteredFeatureSourceSelector,
	findFeatureInFeatureSourcesById,
	findFeatureSourceIdForFeatureId,
} from "@mapsight/core/lib/feature-sources/selectors";
import type {FeatureSourcesState} from "@mapsight/core/lib/feature-sources/types";
import {addFilterFunction} from "@mapsight/core/lib/filter/selectors";
import type {Feature} from "@mapsight/core/types";

import {create} from "../index";
import type {MapsightUiReHydrationState} from "../types";
import {compactFeatureSourceIndexes} from "./compact-feature-source-indexes";
import nodeEmbed from "./node";

function feature(id: string, title = id): Feature {
	return {
		type: "Feature",
		id,
		geometry: {type: "Point", coordinates: [10, 52]},
		properties: {title},
	};
}

const first = feature("duplicate", "first");
const second = feature("duplicate", "second");
const other = feature("other");
const collection = {
	type: "FeatureCollection" as const,
	features: [first, other, second],
	crs: {type: "name", properties: {name: "EPSG:4326"}},
	buildTimestamp: "2026-10-30T12:00:00Z",
	license: "fixture",
};
const config = {
	map: {layers: {}},
	featureSources: {
		places: {
			type: "xhr-json" as const,
			url: "/places.geojson",
			filters: ["compactSsrFixture"],
			enableHistory: true,
			data: collection,
		},
		listCombined: {
			type: "combined" as const,
			featureSourceNames: ["places"],
			data: collection,
		},
	},
	featureSelections: {selected: {features: ["duplicate"]}},
};
const createOptions = {
	validateConfig: false,
	plugins: [],
	renderer: vi.fn(() => "<div>shell</div>"),
};

function server(compact = false) {
	return nodeEmbed({
		styleFunction: vi.fn(() => undefined),
		baseMapsightConfig: config,
		createOptions: {...createOptions},
		compactFeatureSourceIndexes: compact,
	});
}

function hydrate(state: unknown) {
	return create(
		null,
		vi.fn(() => undefined),
		{},
		{
			...createOptions,
			reHydratedState: state as MapsightUiReHydrationState,
		},
	);
}

function sourceState(state: unknown): FeatureSourcesState {
	return (state as {featureSources: FeatureSourcesState}).featureSources;
}

afterEach(() => vi.useRealTimers());

describe("compact feature-source SSR indexes", () => {
	it("omits only derived indexes without mutating source aliases or custom combined data", () => {
		const history = {past: [{data: collection}], future: []};
		const source = {
			type: "combined",
			data: collection,
			ids: ["duplicate", "other", "duplicate"],
			featuresById: {duplicate: first, other},
			dataHistory: history,
			lastActionType: "edited",
			custom: {label: "keep"},
		};
		const state = {
			featureSources: {
				places: source,
				alias: source,
				unloaded: {data: null},
			},
			app: {title: "keep"},
		};
		const compact = compactFeatureSourceIndexes(state) as typeof state;

		expect(compact).toEqual({
			...state,
			featureSources: {
				places: {...source, ids: undefined, featuresById: undefined},
				alias: {...source, ids: undefined, featuresById: undefined},
				unloaded: state.featureSources.unloaded,
			},
		});
		expect(Object.hasOwn(compact.featureSources.places, "ids")).toBe(false);
		expect(
			Object.hasOwn(compact.featureSources.places, "featuresById"),
		).toBe(false);
		expect(compact.featureSources.places.data).toBe(collection);
		expect(compact.featureSources.places.dataHistory).toBe(history);
		expect(compact.featureSources.alias.data).toBe(collection);
		expect(compact.featureSources.unloaded).toBe(
			state.featureSources.unloaded,
		);
		expect(compact.app).toBe(state.app);
		expect(source.featuresById.duplicate).toBe(first);
		expect(source.ids).toEqual(["duplicate", "other", "duplicate"]);
	});

	it.each([undefined, null, 1, [], {}, {featureSources: null}])(
		"leaves a state without source indexes unchanged: %j",
		(state) => expect(compactFeatureSourceIndexes(state)).toBe(state),
	);

	it("keeps the full format by default and compacts only the detached emitted snapshot", () => {
		const full = server();
		const compact = server(true);
		const before = compact.store!.getState();
		const fullState = full.getDehydratedState() as {
			featureSources: FeatureSourcesState;
		};
		const wire = compact.getDehydratedState() as {
			featureSources: FeatureSourcesState;
		};

		expect(fullState.featureSources.places?.ids).toEqual([
			"duplicate",
			"other",
			"duplicate",
		]);
		expect(
			fullState.featureSources.places?.featuresById?.duplicate?.properties
				.title,
		).toBe("first");
		for (const source of Object.values(wire.featureSources)) {
			expect(Object.hasOwn(source, "ids")).toBe(false);
			expect(Object.hasOwn(source, "featuresById")).toBe(false);
		}
		expect(wire.featureSources.places?.data).toEqual(collection);
		expect(wire.featureSources.listCombined?.data).toEqual(
			fullState.featureSources.listCombined?.data,
		);
		expect(compact.store!.getState()).toBe(before);
		expect(sourceState(before).places?.ids).toEqual([
			"duplicate",
			"other",
			"duplicate",
		]);
		expect(JSON.stringify(wire).length).toBeLessThan(
			JSON.stringify(fullState).length,
		);
	});

	it("uses core normalization to restore indexes before the React server snapshot", () => {
		const wire = server(true).getDehydratedState();
		const context = hydrate(wire);
		const state = context.serverState!;
		const sources = sourceState(state);
		const places = sources.places!;

		expect(places.ids).toEqual(["duplicate", "other", "duplicate"]);
		expect(places.featuresById?.duplicate).toBe(places.data?.features?.[0]);
		expect(places.featuresById?.other).toBe(places.data?.features?.[1]);
		expect(places.data).toEqual(collection);
		expect(sources.listCombined?.ids).toEqual(places.ids);
		expect(findFeatureSourceIdForFeatureId(sources, "duplicate")).toBe(
			"places",
		);
		expect(
			findFeatureInFeatureSourcesById(sources, "duplicate")?.properties
				.title,
		).toBe("first");
		expect(state.featureSelections).toEqual(config.featureSelections);

		addFilterFunction("compactSsrFixture", (features) =>
			features.filter((entry) => entry.id === "other"),
		);
		const filtered = createFilteredFeatureSourceSelector(
			"featureSources",
			"places",
		)({...state, compactSsrFixture: true});
		expect(filtered?.ids).toEqual(["other"]);
		expect(filtered?.featuresById?.other).toBe(places.featuresById?.other);
		expect(filtered?.data).toMatchObject({
			license: "fixture",
			crs: collection.crs,
		});
	});

	it("decodes stale indexes and unusual IDs with the same core semantics as full snapshots", () => {
		const features = [
			"",
			"0",
			"1",
			"01",
			"__proto__",
			"constructor",
			"toString",
			"duplicate",
			"duplicate",
		].map((id, index) => feature(id, String(index)));
		const state = {
			featureSources: {
				places: {
					type: "local",
					data: {type: "FeatureCollection", features},
					ids: ["stale"],
					featuresById: {stale: feature("stale")},
				},
			},
		};
		const legacy = sourceState(hydrate(state).serverState);
		const compact = sourceState(
			hydrate(compactFeatureSourceIndexes(state)).serverState,
		);
		expect(compact).toEqual(legacy);
		expect(compact?.places?.ids).toEqual(features.map(({id}) => id));
		expect(compact?.places?.featuresById?.duplicate?.properties.title).toBe(
			"7",
		);
		for (const sources of [legacy, compact]) {
			for (const id of ["__proto__", "constructor", "toString"]) {
				const index = features.findIndex((entry) => entry.id === id);
				expect(
					sources.places?.featuresById?.[id]?.properties.title,
				).toBe(String(index));
				expect(
					findFeatureInFeatureSourcesById(sources, id)?.properties
						.title,
				).toBe(String(index));
			}
		}
		expect(state.featureSources.places.ids).toEqual(["stale"]);
	});

	it("preserves edits and undo/redo history across full and compact hydration", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-10-30T12:00:00Z"));
		const embed = server();
		embed.store!.dispatch(
			updateFeatureProperty(
				"featureSources",
				"places",
				"other",
				"title",
				"edited",
				{},
			),
		);
		const full = embed.getDehydratedState();
		const compact = compactFeatureSourceIndexes(full);
		const legacyStore = hydrate(full).store!;
		const compactStore = hydrate(compact).store!;

		for (const action of [
			undo("featureSources", "places"),
			redo("featureSources", "places"),
			updateFeatureProperty(
				"featureSources",
				"places",
				"other",
				"title",
				"new edit",
				{},
			),
		]) {
			legacyStore.dispatch(action);
			compactStore.dispatch(action);
			expect(compactStore.getState()).toEqual(legacyStore.getState());
		}
		expect(
			sourceState(compactStore.getState()).places?.featuresById?.other
				?.properties.title,
		).toBe("new edit");
		expect(
			sourceState(compactStore.getState()).places?.dataHistory?.past
				.length,
		).toBeGreaterThan(0);
	});

	it.each([{url: "/places-v2.geojson"}, {type: "local"}])(
		"keeps loader invalidation after compact hydration: %j",
		(change) => {
			const full = server().getDehydratedState();
			const stores = [
				hydrate(full).store!,
				hydrate(compactFeatureSourceIndexes(full)).store!,
			];
			for (const store of stores)
				store.dispatch(merge(["featureSources", "places"], change));
			expect(stores[1]!.getState()).toEqual(stores[0]!.getState());
			expect(sourceState(stores[1]!.getState()).places).toMatchObject({
				data: null,
				...change,
			});
			expect(
				findFeatureInFeatureSourcesById(
					sourceState(stores[1]!.getState()),
					"other",
				),
			).toEqual(
				findFeatureInFeatureSourcesById(
					sourceState(stores[0]!.getState()),
					"other",
				),
			);
		},
	);
});
