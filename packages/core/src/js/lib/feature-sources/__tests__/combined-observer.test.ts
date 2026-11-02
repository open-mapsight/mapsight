import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";

import {createMapsightStore} from "@/index";
import {set} from "@/lib/base/actions";
import {setData, setError} from "@/lib/feature-sources/actions";
import {FeatureSourcesController} from "@/lib/feature-sources/controller";
import type {
	FeatureSourceData,
	FeatureSourcesState,
} from "@/lib/feature-sources/types";

const controllerName = "sources";

function collection(name: string, read = () => {}): FeatureSourceData {
	return {
		type: "FeatureCollection",
		features: [
			{
				type: "Feature",
				id: "point-1",
				geometry: {type: "Point", coordinates: [10, 52]},
				properties: {
					get name() {
						read();
						return name;
					},
				},
			},
		],
	};
}

function createStore(data: FeatureSourceData) {
	return createMapsightStore(
		{[controllerName]: new FeatureSourcesController(controllerName)},
		{},
		{
			[controllerName]: {
				items: {type: "local", data},
				other: {type: "local", data: collection("other")},
				combined: {type: "combined", featureSourceNames: ["items"]},
			},
		},
	);
}

function current(store: ReturnType<typeof createStore>, id = "combined") {
	const source = (store.getState()[controllerName] as FeatureSourcesState)[
		id
	];
	if (!source) throw new Error(`Missing test source: ${id}`);
	return source;
}

function unrelatedActions(store: ReturnType<typeof createStore>) {
	for (let index = 0; index < 20; index++) {
		store.dispatch({type: "unrelated", index});
	}
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("combined source observation", () => {
	it("does not repeatedly traverse equal replacement data on unrelated actions", async () => {
		const read = vi.fn();
		const store = createStore(collection("original", read));
		await vi.runAllTimersAsync();
		const original = current(store).data;
		read.mockClear();
		unrelatedActions(store);
		expect(read).not.toHaveBeenCalled();

		store.dispatch(
			setData(controllerName, "items", collection("original", read)),
		);
		await vi.runAllTimersAsync();
		expect(read).toHaveBeenCalled();
		expect(current(store).data).toBe(original);
		read.mockClear();

		unrelatedActions(store);
		expect(read).not.toHaveBeenCalled();
		expect(current(store).data).toBe(original);

		store.dispatch(
			setData(controllerName, "items", collection("original", read)),
		);
		await vi.runAllTimersAsync();
		expect(current(store).data).toBe(original);
		read.mockClear();
		unrelatedActions(store);
		expect(read).not.toHaveBeenCalled();

		const changed = collection("changed", read);
		store.dispatch(setData(controllerName, "items", changed));
		await vi.runAllTimersAsync();
		expect(current(store).data?.features).toEqual(changed.features);
		expect(current(store).data?.features?.[0]).toBe(changed.features?.[0]);
		expect(current(store).data).not.toBe(original);
		read.mockClear();
		unrelatedActions(store);
		expect(read).not.toHaveBeenCalled();

		// Equality against the first value must not hide a later real change.
		store.dispatch(
			setData(controllerName, "items", collection("original", read)),
		);
		await vi.runAllTimersAsync();
		expect(current(store).data?.features?.[0]?.properties?.name).toBe(
			"original",
		);
	});

	it("still excludes errors and restores recovered members after an equal replacement", async () => {
		const store = createStore(collection("original"));
		await vi.runAllTimersAsync();
		store.dispatch(
			setData(controllerName, "items", collection("original")),
		);
		await vi.runAllTimersAsync();

		store.dispatch(setError(controllerName, "items", "offline"));
		await vi.runAllTimersAsync();
		expect(current(store).data?.features).toEqual([]);

		const recovered = collection("recovered");
		store.dispatch(setData(controllerName, "items", recovered));
		await vi.runAllTimersAsync();
		expect(current(store).data?.features?.[0]).toBe(
			recovered.features?.[0],
		);
	});

	it("retires cached comparisons when a binding changes or is removed", async () => {
		const store = createStore(collection("original"));
		await vi.runAllTimersAsync();
		store.dispatch(
			setData(controllerName, "items", collection("original")),
		);
		await vi.runAllTimersAsync();

		store.dispatch(
			set([controllerName, "combined", "featureSourceNames"], ["other"]),
		);
		await vi.runAllTimersAsync();
		expect(current(store).data?.features?.[0]?.properties?.name).toBe(
			"other",
		);
		store.dispatch(
			setData(controllerName, "items", collection("retired member")),
		);
		await vi.runAllTimersAsync();
		expect(current(store).data?.features?.[0]?.properties?.name).toBe(
			"other",
		);

		store.dispatch(set([controllerName, "combined", "type"], "local"));
		await vi.runAllTimersAsync();
		const retired = current(store).data;
		store.dispatch(
			setData(controllerName, "other", collection("new other")),
		);
		await vi.runAllTimersAsync();
		expect(current(store).data).toBe(retired);
	});

	it("keeps comparison caches separate between stores", async () => {
		const first = createStore(collection("first"));
		const second = createStore(collection("second"));
		await vi.runAllTimersAsync();
		first.dispatch(setData(controllerName, "items", collection("first")));
		second.dispatch(setData(controllerName, "items", collection("second")));
		await vi.runAllTimersAsync();

		first.dispatch(
			setData(controllerName, "items", collection("updated first")),
		);
		await vi.runAllTimersAsync();
		expect(current(first).data?.features?.[0]?.properties?.name).toBe(
			"updated first",
		);
		expect(current(second).data?.features?.[0]?.properties?.name).toBe(
			"second",
		);
	});

	it("keeps independent comparisons for multiple bindings in one controller", async () => {
		const store = createStore(collection("original"));
		store.dispatch(
			set([controllerName, "secondCombined"], {
				type: "combined",
				featureSourceNames: ["other"],
			}),
		);
		await vi.runAllTimersAsync();
		const initialOther = current(store, "secondCombined").data;
		store.dispatch(
			setData(controllerName, "items", collection("original")),
		);
		store.dispatch(setData(controllerName, "other", collection("other")));
		await vi.runAllTimersAsync();
		store.dispatch(setData(controllerName, "items", collection("changed")));
		await vi.runAllTimersAsync();
		expect(current(store).data?.features?.[0]?.properties?.name).toBe(
			"changed",
		);
		expect(current(store, "secondCombined").data).toBe(initialOther);
	});
});
