import {describe, expect, it} from "vitest";

import type {State} from "@mapsight/core/types";

import {USER_GEOLOCATION} from "../config/constants/controllers";
import type {RootStateSlice} from "./selectors";
import {
	listFilterOptionsSelector,
	listUiOptionSelectionBehaviorSelector,
	listUiOptionsSelector,
} from "./selectors";

function baseState(app: RootStateSlice["app"] = {}): RootStateSlice & State {
	return {
		app,
		[USER_GEOLOCATION]: {},
	} as RootStateSlice & State;
}

describe("listFilterOptionsSelector", () => {
	it("returns the same object reference for identical state", () => {
		const state = baseState({
			listQuery: "park",
			listSorting: "name",
			places: {center: {title: "Center", x: 1, y: 2}},
		});

		const first = listFilterOptionsSelector(state);
		const second = listFilterOptionsSelector(state);

		expect(first).toEqual({
			query: "park",
			sorting: "name",
			places: {center: {title: "Center", x: 1, y: 2}},
		});
		expect(first).toBe(second);
	});

	it("keeps reference equality across unrelated app updates", () => {
		const places = {center: {title: "Center", x: 1, y: 2}};
		const before = baseState({
			listQuery: "park",
			listSorting: "name",
			places,
			title: "before",
		});
		const after = baseState({
			listQuery: "park",
			listSorting: "name",
			places,
			title: "after",
		});

		expect(listFilterOptionsSelector(before)).toBe(
			listFilterOptionsSelector(after),
		);
	});

	it("memoizes per featureSourceId argument", () => {
		const state = baseState({
			listQuery: "",
			listDefaultSortingByFeatureSource: {
				parking: {place: "center"},
				events: {place: "name"},
			},
			places: {},
		});

		const parkingA = listFilterOptionsSelector(state, "parking");
		const parkingB = listFilterOptionsSelector(state, "parking");
		const events = listFilterOptionsSelector(state, "events");

		expect(parkingA).toBe(parkingB);
		expect(parkingA).not.toBe(events);
		expect(parkingA.sorting).toBe("center");
		expect(events.sorting).toBe("name");
	});
});

describe("listUiOptionsSelector", () => {
	it("returns a stable empty object when list is missing", () => {
		const state = baseState({});
		expect(listUiOptionsSelector(state)).toBe(
			listUiOptionsSelector(baseState({})),
		);
	});
});

describe("listUiOptionSelectionBehaviorSelector", () => {
	it("returns a stable empty object when selectionBehavior is missing", () => {
		const state = baseState({list: {show: true}});
		expect(listUiOptionSelectionBehaviorSelector(state)).toBe(
			listUiOptionSelectionBehaviorSelector(
				baseState({list: {show: false}}),
			),
		);
	});
});
