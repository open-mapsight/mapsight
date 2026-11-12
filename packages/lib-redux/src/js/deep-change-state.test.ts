import {describe, expect, it} from "vitest";

import deepChangeState from "./deep-change-state";

describe("deepChangeState", () => {
	it("returns the replacement value for the root path", () => {
		const replacement = {value: 2};

		expect(deepChangeState({value: 1}, [], replacement)).toBe(replacement);
	});

	it("clones each parent while retaining unrelated references", () => {
		const retained = {value: "retained"};
		const state = {
			levelOne: {
				levelTwo: {
					value: "before",
				},
				retained,
			},
			retained,
		};

		const nextState = deepChangeState(
			state,
			["levelOne", "levelTwo", "value"],
			"after",
		) as typeof state;

		expect(nextState).toEqual({
			levelOne: {
				levelTwo: {
					value: "after",
				},
				retained,
			},
			retained,
		});
		expect(nextState).not.toBe(state);
		expect(nextState.levelOne).not.toBe(state.levelOne);
		expect(nextState.levelOne.levelTwo).not.toBe(state.levelOne.levelTwo);
		expect(nextState.levelOne.retained).toBe(retained);
		expect(nextState.retained).toBe(retained);
		expect(state.levelOne.levelTwo.value).toBe("before");
	});
	it("copies arrays along the path as arrays", () => {
		const first = {a: 1};
		const second = {a: 2};
		const state = {list: [first, second]};

		const nextState = deepChangeState(
			state,
			["list", 0, "a"],
			10,
		) as typeof state;

		expect(Array.isArray(nextState.list)).toBe(true);
		expect(nextState.list).toEqual([{a: 10}, {a: 2}]);
		expect(nextState.list).not.toBe(state.list);
		expect(nextState.list[1]).toBe(second);
		expect(first.a).toBe(1);
	});

	it("keeps an array root as an array", () => {
		const state = [{a: 1}];

		const nextState = deepChangeState(state, [0, "a"], 2);

		expect(Array.isArray(nextState)).toBe(true);
		expect(nextState).toEqual([{a: 2}]);
	});
});
