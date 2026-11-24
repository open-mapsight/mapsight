import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";

import {createMapsightStore} from "@/index";
import {set} from "@/lib/base/actions";
import {
	removeFeatureSource,
	setData,
	setError,
} from "@/lib/feature-sources/actions";
import {FeatureSourcesController} from "@/lib/feature-sources/controller";
import type {
	FeatureSourceData,
	FeatureSourcesState,
} from "@/lib/feature-sources/types";
import type {State} from "@/types";

const controllerName = "featureSources";

function collection(id: string): FeatureSourceData {
	return {
		type: "FeatureCollection",
		features: [
			{
				type: "Feature",
				id,
				geometry: {type: "Point", coordinates: [0, 0]},
				properties: {},
			},
		],
	};
}

function setup(withTarget = true) {
	const controller = new FeatureSourcesController(controllerName);
	const store = createMapsightStore(
		{[controllerName]: controller},
		{},
		{
			[controllerName]: {
				input: {type: "local", data: collection("input")},
				...(withTarget
					? {target: {type: "local", data: collection("target")}}
					: {}),
			},
		},
	);
	const selectInput = vi.fn((state: State) => {
		const {input} = state[controllerName] as FeatureSourcesState;
		if (!input) {
			throw new Error("Expected an input source");
		}
		return input;
	});
	const target = () =>
		(store.getState()[controllerName] as FeatureSourcesState).target;
	const createTarget = (id: string) =>
		store.dispatch(
			set([controllerName, "target"], {
				type: "local",
				data: collection(id),
			}),
		);
	const updateInput = (id: string) =>
		store.dispatch(setData(controllerName, "input", collection(id)));
	const bind = () =>
		controller.bindFeatureSourceToStore("target", selectInput);
	return {store, selectInput, target, createTarget, updateInput, bind};
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
	vi.useRealTimers();
});

describe("bindFeatureSourceToStore", () => {
	it.each(["data", "error"] as const)(
		"retires the binding and its queued %s when the target is deleted",
		(update) => {
			const {
				store,
				selectInput,
				target,
				createTarget,
				updateInput,
				bind,
			} = setup();
			bind();
			if (update === "error") {
				store.dispatch(
					setError(controllerName, "input", "old binding error"),
				);
			} else {
				updateInput("queued");
			}

			store.dispatch(removeFeatureSource(controllerName, "target"));
			createTarget("replacement");
			const replacement = target();
			vi.runAllTimers();
			expect(target()).toBe(replacement);

			selectInput.mockClear();
			updateInput("after removal");
			vi.runAllTimers();
			expect(selectInput).not.toHaveBeenCalled();
			expect(target()).toBe(replacement);

			bind();
			updateInput("after rebind");
			vi.runAllTimers();
			expect(target()?.ids).toEqual(["after rebind"]);
		},
	);

	it("cancels queued and future writes when explicitly unbound", () => {
		const {selectInput, target, updateInput, bind} = setup();
		const unbind = bind();
		updateInput("queued");
		unbind();
		unbind();

		selectInput.mockClear();
		updateInput("after unbind");
		vi.runAllTimers();
		expect(selectInput).not.toHaveBeenCalled();
		expect(target()?.ids).toEqual(["target"]);
	});

	it("starts observing writes once the initially absent target is registered", () => {
		const {target, createTarget, updateInput, bind} = setup(false);
		bind();
		updateInput("while absent");
		createTarget("registered");
		vi.runAllTimers();
		expect(target()?.ids).toEqual(["registered"]);

		updateInput("after registration");
		vi.runAllTimers();
		expect(target()?.ids).toEqual(["after registration"]);
	});
});
