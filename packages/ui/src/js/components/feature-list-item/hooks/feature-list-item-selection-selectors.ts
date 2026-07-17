import type {Selector} from "@reduxjs/toolkit";
import {createSelector} from "@reduxjs/toolkit";

import type {FeatureSelectionState} from "@mapsight/core/lib/feature-selections/selectors";
import {
	createFeatureSelectionSelector,
	getFilteredFeatures,
} from "@mapsight/core/lib/feature-selections/selectors";
import type {FeatureId, State} from "@mapsight/core/types";

import {FEATURE_SELECTIONS} from "../../../config/constants/controllers";
import {
	FEATURE_SELECTION_HIGHLIGHT,
	FEATURE_SELECTION_PRESELECT,
	FEATURE_SELECTION_SELECT,
} from "../../../config/feature/selections";

const EMPTY_FEATURE_IDS: FeatureId[] = [];

const createFilteredFeatureIdsSelector = (
	selectionSelector: Selector<State, FeatureSelectionState | undefined>,
): Selector<State, FeatureId[]> =>
	createSelector(selectionSelector, (selection) => {
		return getFilteredFeatures(selection) ?? EMPTY_FEATURE_IDS;
	});

export const selectSelectionFeatureIdsSelector =
	createFilteredFeatureIdsSelector(
		createFeatureSelectionSelector(
			FEATURE_SELECTIONS,
			FEATURE_SELECTION_SELECT,
		),
	);

export const preselectSelectionFeatureIdsSelector =
	createFilteredFeatureIdsSelector(
		createFeatureSelectionSelector(
			FEATURE_SELECTIONS,
			FEATURE_SELECTION_PRESELECT,
		),
	);

export const highlightSelectionFeatureIdsSelector =
	createFilteredFeatureIdsSelector(
		createFeatureSelectionSelector(
			FEATURE_SELECTIONS,
			FEATURE_SELECTION_HIGHLIGHT,
		),
	);

/** True when the primary select selection contains at least one feature. */
export const hasSelectSelectionSelector = createSelector(
	selectSelectionFeatureIdsSelector,
	(ids) => ids.length > 0,
);

const isSelectedSelectorCache = new Map<FeatureId, Selector<State, boolean>>();
const isPreselectedSelectorCache = new Map<
	FeatureId,
	Selector<State, boolean>
>();
const isHighlightedSelectorCache = new Map<
	FeatureId,
	Selector<State, boolean>
>();

function getOrCreateMembershipSelector(
	cache: Map<FeatureId, Selector<State, boolean>>,
	idsSelector: Selector<State, FeatureId[]>,
	featureId: FeatureId,
): Selector<State, boolean> {
	let selector = cache.get(featureId);
	if (!selector) {
		selector = createSelector(idsSelector, (ids) =>
			ids.includes(featureId),
		);
		cache.set(featureId, selector);
	}
	return selector;
}

export function createIsSelectedSelector(
	featureId: FeatureId,
): Selector<State, boolean> {
	return getOrCreateMembershipSelector(
		isSelectedSelectorCache,
		selectSelectionFeatureIdsSelector,
		featureId,
	);
}

export function createIsPreselectedSelector(
	featureId: FeatureId,
): Selector<State, boolean> {
	return getOrCreateMembershipSelector(
		isPreselectedSelectorCache,
		preselectSelectionFeatureIdsSelector,
		featureId,
	);
}

export function createIsHighlightedSelector(
	featureId: FeatureId,
): Selector<State, boolean> {
	return getOrCreateMembershipSelector(
		isHighlightedSelectorCache,
		highlightSelectionFeatureIdsSelector,
		featureId,
	);
}
