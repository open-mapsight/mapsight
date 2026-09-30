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
});
