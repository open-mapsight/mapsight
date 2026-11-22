import {afterEach, describe, expect, it, vi} from "vitest";

import {selectExclusively} from "@mapsight/core/lib/feature-selections/actions";

import {create} from "../../index";
import createFeatureDeepLinkPlugin from "./feature-deep-link";

const instances: ReturnType<typeof createFeatureDeepLinkPlugin>[] = [];

function setup(url: string, historyState: unknown) {
	window.history.replaceState(historyState, "", url);
	const replaceAddress = window.history.replaceState.bind(window.history);
	const plugin = createFeatureDeepLinkPlugin();
	instances.push(plugin);
	const context = create(
		null,
		vi.fn(),
		{map: {layers: {}}},
		{
			renderer: vi.fn(),
			validateConfig: false,
			plugins: [["featureDeepLink", plugin]],
		},
	);
	context.render!();
	const selected = () =>
		(
			context.store!.getState() as {
				featureSelections: {select?: {features: string[]}};
			}
		).featureSelections.select?.features;
	return {
		selected,
		store: context.store!,
		traverse(url: string, state: unknown) {
			replaceAddress(state, "", url);
			window.dispatchEvent(new PopStateEvent("popstate", {state}));
		},
	};
}

afterEach(() => {
	vi.restoreAllMocks();
	for (const plugin of instances.splice(0).reverse()) {
		plugin.destroy();
	}
	window.history.replaceState(null, "", "/");
});

describe("feature deep link and history replacements", () => {
	it("ignores a replacement that names the feature that is already selected", () => {
		const s = setup("/page?feature=x", {featureId: "x"});
		expect(s.selected()).toEqual(["x"]);
		const before = s.store.getState();
		const push = vi.spyOn(window.history, "pushState");

		window.history.replaceState(
			window.history.state,
			"",
			"/page?feature=x#map=1/2/3",
		);

		expect(s.store.getState()).toBe(before);
		expect(push).not.toHaveBeenCalled();
		expect(window.location.search).toBe("?feature=x");
	});

	it("still follows a replacement that names another feature or none", () => {
		const s = setup("/page?feature=x", {featureId: "x"});

		window.history.replaceState({featureId: "y"}, "", "/page?feature=x");
		expect(s.selected()).toEqual(["y"]);

		window.history.replaceState({featureId: null}, "", "/page?feature=x");
		expect(s.selected()).toEqual([]);
	});

	it("follows pushState and history traversal", () => {
		const s = setup("/page", {featureId: "first"});
		window.history.pushState({featureId: "second"}, "", "/page#second");
		expect(s.selected()).toEqual(["second"]);

		window.dispatchEvent(
			new PopStateEvent("popstate", {state: {featureId: "first"}}),
		);
		expect(s.selected()).toEqual(["first"]);
		window.dispatchEvent(
			new PopStateEvent("popstate", {state: {featureId: null}}),
		);
		expect(s.selected()).toEqual([]);
	});

	it("ignores primitive state and invalid feature ids", () => {
		const s = setup("/page", 1);
		expect(s.selected()).toBeUndefined();
		window.history.pushState({featureId: 1}, "", "/page");
		expect(s.selected()).toBeUndefined();
	});

	it.each(["pushState", "replaceState"] as const)(
		"keeps explicit %s state, address and entry count",
		(method) => {
			const s = setup("/page?feature=one", null);
			const length = window.history.length;
			window.history[method](
				{featureId: "two", host: 1},
				"",
				"/page?feature=two",
			);
			expect(s.selected()).toEqual(["two"]);
			expect(window.location.search).toBe("?feature=two");
			expect(window.history.state).toEqual({featureId: "two", host: 1});
			expect(window.history.length).toBe(
				length + (method === "pushState" ? 1 : 0),
			);
		},
	);

	it.each([null, {featureId: "stale", host: 1}])(
		"traverses back to the query and forward to the selection after cleanup (%j)",
		(state) => {
			const s = setup("/page?feature=one", state);
			s.store.dispatch(
				selectExclusively(
					"featureSelections",
					"select",
					"two",
				) as never,
			);
			const forwardState: unknown = window.history.state;
			expect(window.location.search).toBe("");
			const length = window.history.length;
			s.traverse("/page?feature=one", state);
			expect(s.selected()).toEqual(["one"]);
			s.traverse("/page", forwardState);
			expect(s.selected()).toEqual(["two"]);
			expect(window.history.length).toBe(length);
		},
	);

	it("restores a feature ID before its data is available", () => {
		const s = setup("/page", null);
		s.traverse("/page", {featureId: "unresolved"});
		expect(s.selected()).toEqual(["unresolved"]);
	});
	it("follows a history entry without pushing an entry for query cleanup", () => {
		const s = setup("/page?feature=x", {featureId: "x"});
		expect(s.selected()).toEqual(["x"]);
		const push = vi.spyOn(window.history, "pushState");

		s.traverse("/page", {featureId: "y"});

		expect(s.selected()).toEqual(["y"]);
		expect(push).not.toHaveBeenCalled();
	});
});
