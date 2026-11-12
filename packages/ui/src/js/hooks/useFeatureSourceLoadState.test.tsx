import {type ReactNode} from "react";
import {Provider} from "react-redux";

import {configureStore} from "@reduxjs/toolkit";
import {act, renderHook} from "@testing-library/react";
import {describe, expect, it} from "vitest";

import type {FeatureSourcesState} from "@mapsight/core/lib/feature-sources/types";

import {FEATURE_SOURCES} from "../config/constants/controllers";
import useFeatureSourceLoadState from "./useFeatureSourceLoadState";

type Sources = Record<string, Partial<FeatureSourcesState[string]>>;

function createStore(initial: Sources = {}) {
	return configureStore({
		reducer: (
			state: Record<string, Sources> = {},
			action: {type: string; sources?: Sources},
		) =>
			action.type === "replace"
				? {[FEATURE_SOURCES]: action.sources ?? {}}
				: state,
		preloadedState: {[FEATURE_SOURCES]: initial},
	});
}

function setup(
	initial: Sources,
	...args: Parameters<typeof useFeatureSourceLoadState>
) {
	const store = createStore(initial);
	const renders: string[] = [];
	const wrapper = ({children}: {children: ReactNode}) => (
		<Provider store={store}>{children}</Provider>
	);
	const hook = renderHook(
		() => {
			const state = useFeatureSourceLoadState(...args);
			renders.push(state);
			return state;
		},
		{wrapper},
	);
	const replace = (sources: Sources) =>
		act(() => {
			store.dispatch({type: "replace", sources});
		});
	return {...hook, renders, replace};
}

describe("useFeatureSourceLoadState", () => {
	it("follows the source through its states", () => {
		const view = setup({}, "places");
		expect(view.result.current).toBe("missing");

		view.replace({places: {data: null}});
		expect(view.result.current).toBe("idle");
		view.replace({places: {data: null, isLoading: true}});
		expect(view.result.current).toBe("loading");
		view.replace({places: {data: {features: []}}});
		expect(view.result.current).toBe("ok");
		view.replace({places: {data: {features: []}, error: "down"}});
		expect(view.result.current).toBe("error");
		view.replace({});
		expect(view.result.current).toBe("missing");
	});

	it("reads the given controller", () => {
		const store = configureStore({
			reducer: () => ({
				[FEATURE_SOURCES]: {places: {data: null}},
				other: {places: {data: {features: []}}},
			}),
		});
		const {result} = renderHook(
			() => useFeatureSourceLoadState("places", "other"),
			{
				wrapper: ({children}) => (
					<Provider store={store}>{children}</Provider>
				),
			},
		);
		expect(result.current).toBe("ok");
	});

	it("only looks at own entries, so prototype-like ids are not sources", () => {
		const view = setup({}, "constructor");
		expect(view.result.current).toBe("missing");
		const proto = setup({}, "__proto__");
		expect(proto.result.current).toBe("missing");

		const own = setup(
			JSON.parse('{"__proto__": {"data": null}}') as Sources,
			"__proto__",
		);
		expect(own.result.current).toBe("idle");
	});

	it("does not re-render when only the data changes", () => {
		const view = setup({places: {data: {features: []}}}, "places");
		const before = view.renders.length;
		view.replace({
			places: {data: {features: [{id: "a"}]} as never, lastUpdate: 1},
		});
		expect(view.result.current).toBe("ok");
		expect(view.renders).toHaveLength(before);
	});
});
