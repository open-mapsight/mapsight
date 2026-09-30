import {describe, expect, it} from "vitest";

import type {FeatureSourceState} from "@mapsight/core/lib/feature-sources/types";
import type {State} from "@mapsight/core/types";

import {FEATURE_SOURCES} from "../../config/constants/controllers";
import {combinedMemberSourcesSelector} from "./combined-member-sources-selector";

function stateWithSources(sources: Record<string, FeatureSourceState>): State {
	return {
		[FEATURE_SOURCES]: sources,
	};
}

describe("combinedMemberSourcesSelector", () => {
	it("returns undefined for non-combined sources with stable identity", () => {
		const state = stateWithSources({});
		const source = {type: "xhr-json"} as FeatureSourceState;

		expect(combinedMemberSourcesSelector(state, source)).toBeUndefined();
		expect(combinedMemberSourcesSelector(state, source)).toBe(
			combinedMemberSourcesSelector(state, source),
		);
		expect(combinedMemberSourcesSelector(state, undefined)).toBeUndefined();
	});

	it("returns a stable empty array when combined names are empty", () => {
		const state = stateWithSources({});
		const source = {
			type: "combined",
			featureSourceNames: [],
		} as FeatureSourceState;

		const first = combinedMemberSourcesSelector(state, source);
		const second = combinedMemberSourcesSelector(state, source);

		expect(first).toEqual([]);
		expect(first).toBe(second);
	});

	it("returns the same member array reference for identical inputs", () => {
		const museen = {type: "xhr-json"} as FeatureSourceState;
		const theater = {type: "xhr-json"} as FeatureSourceState;
		const state = stateWithSources({museen, theater});
		const source = {
			type: "combined",
			featureSourceNames: ["museen", "theater"],
		} as FeatureSourceState;

		const first = combinedMemberSourcesSelector(state, source);
		const second = combinedMemberSourcesSelector(state, source);

		expect(first).toEqual([museen, theater]);
		expect(first).toBe(second);
	});

	it("keeps reference equality when unrelated store slices change", () => {
		const museen = {type: "xhr-json"} as FeatureSourceState;
		const sources = {museen};
		const source = {
			type: "combined",
			featureSourceNames: ["museen"],
		} as FeatureSourceState;
		const before = {
			[FEATURE_SOURCES]: sources,
			app: {title: "before"},
		};
		const after = {
			[FEATURE_SOURCES]: sources,
			app: {title: "after"},
		};

		expect(combinedMemberSourcesSelector(before, source)).toBe(
			combinedMemberSourcesSelector(after, source),
		);
	});
});
