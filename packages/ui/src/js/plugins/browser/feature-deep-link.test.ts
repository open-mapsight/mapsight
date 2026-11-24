import {afterEach, describe, expect, it, vi} from "vitest";

import {
	deselectAll,
	selectExclusively,
} from "@mapsight/core/lib/feature-selections/actions";
import {setData} from "@mapsight/core/lib/feature-sources/actions";

import {create} from "../../index";
import type {PluginDefinition} from "../../types";
import createOlProxyPlugin from "../common/ol-proxy";
import createFeatureDeepLinkPlugin from "./feature-deep-link";
import createViewPermalinkPlugin from "./view-permalink";

const instances: ReturnType<typeof createFeatureDeepLinkPlugin>[] = [];

function setup(
	url: string,
	historyState: unknown,
	{preselect = false, reveal = false} = {},
) {
	window.history.replaceState(historyState, "", url);
	const replaceAddress = window.history.replaceState.bind(window.history);
	const plugin = createFeatureDeepLinkPlugin();
	instances.push(plugin);
	const plugins: PluginDefinition[] = [["featureDeepLink", plugin]];
	if (preselect) {
		const preselectPlugin = createFeatureDeepLinkPlugin({
			getParameter: "preselect",
			featureSelection: "preselect",
			clearMissingParameters: ["feature"],
		});
		instances.push(preselectPlugin);
		plugins.unshift(["featurePreselectDeepLink", preselectPlugin]);
	}
	const permalink = reveal
		? createViewPermalinkPlugin({viewParameter: false})
		: undefined;
	if (permalink) {
		instances.push(permalink);
		plugins.unshift(
			["olProxy", createOlProxyPlugin()],
			["viewPermalink", permalink],
		);
	}
	const tile = (visible: boolean) => ({
		type: "TileLayer",
		metaData: {visibleInLayerSwitcher: true},
		options: {visible, source: {type: "OsmSource", options: {}}},
	});
	const context = create(
		null,
		vi.fn(),
		reveal
			? {
					map: {layers: {baseA: tile(true), parks: tile(true)}},
					featureSources: {parks: {type: "local"}},
				}
			: {map: {layers: {}}},
		{
			renderer: vi.fn(),
			validateConfig: false,
			plugins,
		},
	);
	context.render!();
	const selected = (selection = "select") =>
		(
			context.store!.getState() as {
				featureSelections: Record<
					string,
					{features: string[]} | undefined
				>;
			}
		).featureSelections[selection]?.features;
	return {
		selected,
		store: context.store!,
		destroy: () => plugin.destroy(),
		parksVisible() {
			const state = context.store!.getState() as {
				map: {layers: {parks: {options: {visible: boolean}}}};
			};
			return state.map.layers.parks.options.visible;
		},
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
			const hash = "#map=8/52/10&layers=base";
			const s = setup("/page?feature=one" + hash, state);
			s.store.dispatch(
				selectExclusively(
					"featureSelections",
					"select",
					"two",
				) as never,
			);
			const forwardState: unknown = window.history.state;
			expect(window.location.search).toBe("");
			expect(window.location.hash).toBe(hash);
			const length = window.history.length;
			s.traverse("/page?feature=one" + hash, state);
			expect(s.selected()).toEqual(["one"]);
			s.traverse("/page" + hash, forwardState);
			expect(s.selected()).toEqual(["two"]);
			expect(window.history.length).toBe(length);
		},
	);

	it("only restores the preselection owned by the cleanup entry", () => {
		const s = setup(
			"/page?preselect=one#keep",
			{host: 1},
			{preselect: true},
		);
		expect(s.selected("preselect")).toEqual(["one"]);
		s.store.dispatch(
			selectExclusively("featureSelections", "preselect", "two") as never,
		);
		const forwardState: unknown = window.history.state;
		const forwardUrl = window.location.href;

		s.traverse("/page?preselect=one#keep", {host: 1});
		expect(s.selected("preselect")).toEqual(["one"]);
		s.traverse(forwardUrl, forwardState);
		expect(s.selected() ?? []).toEqual([]);
		expect(s.selected("preselect")).toEqual(["two"]);
		expect(forwardState).toMatchObject({host: 1, featureId: null});
		expect(window.location.search).toBe("");
		expect(window.location.hash).toBe("#keep");
	});

	it.each([null, "previous"])(
		"restores the details state saved by preselection cleanup (%j)",
		(previous) => {
			const hash = "#map=8/52/10&layers=baseA";
			const s = setup(
				"/page?preselect=one" + hash,
				{host: 1, featureId: "stale"},
				{preselect: true},
			);
			s.store.dispatch(
				(previous === null
					? deselectAll("featureSelections", "select")
					: selectExclusively(
							"featureSelections",
							"select",
							previous,
						)) as never,
			);
			s.store.dispatch(
				selectExclusively(
					"featureSelections",
					"preselect",
					"two",
				) as never,
			);
			const cleanupUrl = window.location.href;
			const cleanupState: unknown = window.history.state;

			window.history.pushState(
				{featureId: "other"},
				"",
				"/page?feature=other" + hash,
			);
			expect(s.selected()).toEqual(["other"]);
			s.traverse(cleanupUrl, cleanupState);
			expect(s.selected()).toEqual(previous === null ? [] : [previous]);
			expect(s.selected("preselect")).toEqual(["two"]);
			expect(cleanupState).toMatchObject({host: 1, featureId: previous});
			expect(window.location.search).toBe("");
			expect(window.location.hash).toBe(hash);
		},
	);

	it("arms query cleanup again after returning to the original feature link", () => {
		const hash = "#map=8/52/10&layers=baseA";
		const entry = "/page?feature=one" + hash;
		const s = setup(entry, {host: 1});
		s.store.dispatch(
			selectExclusively("featureSelections", "select", "two") as never,
		);
		s.traverse(entry, {host: 1});
		expect(s.selected()).toEqual(["one"]);
		s.store.dispatch(
			selectExclusively("featureSelections", "select", "three") as never,
		);
		expect(window.location.search).toBe("");
		expect(window.location.hash).toBe(hash);
		expect(window.history.state).toEqual({host: 1, featureId: "three"});
	});

	it.each(["traverse", "destroy"])(
		"cancels a delayed reveal on %s",
		(reason) => {
			const s = setup("/page#layers=baseA", null, {reveal: true});
			const hash = "#layers=baseA";
			s.traverse("/page?feature=late" + hash, null);
			if (reason === "traverse") {
				s.traverse("/page?feature=current" + hash, null);
				expect(s.selected()).toEqual(["current"]);
			} else {
				s.destroy();
			}
			expect(s.parksVisible()).toBe(false);
			s.store.dispatch(
				setData("featureSources", "parks", {
					type: "FeatureCollection",
					features: [
						{
							type: "Feature",
							id: "late",
							properties: {},
							geometry: null,
						},
					],
				}) as never,
			);
			expect(s.parksVisible()).toBe(false);
			if (reason === "traverse") {
				s.store.dispatch(
					setData("featureSources", "parks", {
						type: "FeatureCollection",
						features: [
							{
								type: "Feature",
								id: "current",
								properties: {},
								geometry: null,
							},
						],
					}) as never,
				);
				expect(s.parksVisible()).toBe(true);
			}
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
