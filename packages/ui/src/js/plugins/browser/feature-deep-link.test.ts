import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";

import {create} from "../../index";
import createFeatureDeepLinkPlugin from "./feature-deep-link";

const original = {
	pushState: window.history.pushState,
	replaceState: window.history.replaceState,
};

function setup(url: string, historyState: unknown) {
	window.history.replaceState(historyState, "", url);
	const context = create(
		null,
		vi.fn(),
		{map: {layers: {}}},
		{
			renderer: vi.fn(),
			validateConfig: false,
			plugins: [["featureDeepLink", createFeatureDeepLinkPlugin()]],
		},
	);
	context.render!();
	const selected = () =>
		(
			context.store!.getState() as {
				featureSelections: {select?: {features: string[]}};
			}
		).featureSelections.select?.features;
	return {selected, store: context.store!};
}

beforeEach(() => {
	window.history.pushState = original.pushState;
	window.history.replaceState = original.replaceState;
});

afterEach(() => {
	// the plugin patches the global history functions
	window.history.pushState = original.pushState;
	window.history.replaceState = original.replaceState;
	vi.restoreAllMocks();
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
});
