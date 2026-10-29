import {describe, expect, it} from "vitest";

import {
	layerIdsExternalSwitcherSelector,
	layerIdsIntegratedSwitcherSelector,
} from "@/lib/map/selectors";
import type {MapState} from "@/lib/map/types";

const switchers = [
	{
		name: "integrated",
		selector: layerIdsIntegratedSwitcherSelector,
		flag: "visibleInLayerSwitcher",
		otherFlag: "visibleInExternalLayerSwitcher",
	},
	{
		name: "external",
		selector: layerIdsExternalSwitcherSelector,
		flag: "visibleInExternalLayerSwitcher",
		otherFlag: "visibleInLayerSwitcher",
	},
] as const;

describe.each(switchers)(
	"$name layer switcher ids",
	({selector, flag, otherFlag}) => {
		function makeState(): MapState {
			return {
				layers: {
					street: {
						metaData: {[flag]: true},
						options: {visible: true},
					},
					parking: {
						metaData: {[flag]: true},
						options: {visible: false},
					},
					otherSwitcher: {metaData: {[otherFlag]: true}},
					hidden: {metaData: {[flag]: false}},
					noMetadata: {},
				},
				size: [800, 600],
			};
		}

		it("keeps the same ids across view updates", () => {
			const state = makeState();
			const ids = selector(state);
			expect(ids).toEqual(["street", "parking"]);
			expect(
				selector({...state, size: [1024, 768], view: {zoom: 14}}),
			).toBe(ids);
		});

		it("keeps the same ids when layer options or unrelated metadata change", () => {
			const state = makeState();
			const ids = selector(state);
			const next: MapState = {
				...state,
				layers: {
					...state.layers,
					street: {
						metaData: {
							[flag]: true,
							title: "New title",
							[otherFlag]: true,
						},
						options: {visible: false},
					},
				},
			};
			expect(selector(next)).toBe(ids);
		});

		it("updates ids when switcher membership changes", () => {
			const state = makeState();
			const ids = selector(state);
			const next: MapState = {
				...state,
				layers: {
					...state.layers,
					street: {metaData: {[flag]: false}},
					hidden: {metaData: {[flag]: true}},
				},
			};
			expect(selector(next)).toEqual(["parking", "hidden"]);
			expect(selector(next)).not.toBe(ids);
		});

		it("reflects additions, removals and layer order", () => {
			const state = makeState();
			expect(selector(state)).toEqual(["street", "parking"]);
			const withAdded: MapState = {
				...state,
				layers: {...state.layers, added: {metaData: {[flag]: true}}},
			};
			expect(selector(withAdded)).toEqual(["street", "parking", "added"]);
			const {street: _street, ...remaining} = withAdded.layers;
			const withoutStreet = {...state, layers: remaining};
			expect(selector(withoutStreet)).toEqual(["parking", "added"]);
			const reordered = {
				...state,
				layers: {added: remaining.added!, ...remaining},
			};
			expect(selector(reordered)).toEqual(["added", "parking"]);
		});

		it("keeps empty results stable", () => {
			const state: MapState = {layers: {}, size: [800, 600]};
			const ids = selector(state);
			expect(ids).toEqual([]);
			expect(selector({...state, layers: {hidden: {}}})).toBe(ids);
		});
	},
);
