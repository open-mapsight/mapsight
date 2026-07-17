import {describe, expect, it} from "vitest";

import type {State} from "@mapsight/core/types";

import {FEATURE_SELECTIONS} from "../../../config/constants/controllers";
import {
	FEATURE_SELECTION_HIGHLIGHT,
	FEATURE_SELECTION_SELECT,
} from "../../../config/feature/selections";
import {
	createIsHighlightedSelector,
	createIsSelectedSelector,
	hasSelectSelectionSelector,
} from "./feature-list-item-selection-selectors";

function stateWithSelections(options: {
	select?: string[];
	highlight?: string[];
	selectMax?: number;
}): State {
	return {
		[FEATURE_SELECTIONS]: {
			[FEATURE_SELECTION_SELECT]: {
				features: options.select ?? [],
				...(options.selectMax !== undefined
					? {max: options.selectMax}
					: null),
			},
			[FEATURE_SELECTION_HIGHLIGHT]: {
				features: options.highlight ?? [],
			},
		},
	};
}

describe("feature-list-item-selection-selectors", () => {
	it("caches per-feature membership selectors by id", () => {
		expect(createIsSelectedSelector("a")).toBe(
			createIsSelectedSelector("a"),
		);
		expect(createIsSelectedSelector("a")).not.toBe(
			createIsSelectedSelector("b"),
		);
	});

	it("only flips membership for features in the selection", () => {
		const isASelected = createIsSelectedSelector("a");
		const isBSelected = createIsSelectedSelector("b");
		const isCSelected = createIsSelectedSelector("c");

		const before = stateWithSelections({select: ["a"]});
		expect(isASelected(before)).toBe(true);
		expect(isBSelected(before)).toBe(false);
		expect(isCSelected(before)).toBe(false);

		const after = stateWithSelections({select: ["b"]});
		expect(isASelected(after)).toBe(false);
		expect(isBSelected(after)).toBe(true);
		expect(isCSelected(after)).toBe(false);
	});

	it("keeps hasSelectSelection stable across select swaps", () => {
		const withA = stateWithSelections({select: ["a"]});
		const withB = stateWithSelections({select: ["b"]});
		expect(hasSelectSelectionSelector(withA)).toBe(true);
		expect(hasSelectSelectionSelector(withB)).toBe(true);
		expect(hasSelectSelectionSelector(withA)).toBe(
			hasSelectSelectionSelector(withB),
		);
	});

	it("does not treat highlight changes as select membership", () => {
		const isASelected = createIsSelectedSelector("a");
		const isAHighlighted = createIsHighlightedSelector("a");

		const selectedOnly = stateWithSelections({
			select: ["a"],
			highlight: [],
		});
		const highlightedOnly = stateWithSelections({
			select: [],
			highlight: ["a"],
		});

		expect(isASelected(selectedOnly)).toBe(true);
		expect(isAHighlighted(selectedOnly)).toBe(false);
		expect(isASelected(highlightedOnly)).toBe(false);
		expect(isAHighlighted(highlightedOnly)).toBe(true);
	});

	it("respects selection max when deriving membership", () => {
		const isASelected = createIsSelectedSelector("a");
		const isBSelected = createIsSelectedSelector("b");
		const state = stateWithSelections({
			select: ["a", "b"],
			selectMax: 1,
		});

		expect(isASelected(state)).toBe(true);
		expect(isBSelected(state)).toBe(false);
	});
});
