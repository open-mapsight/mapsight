import type {Dispatch} from "@reduxjs/toolkit";
import {batchActions} from "redux-batched-actions";

import {
	deselectAll,
	selectExclusively,
} from "@mapsight/core/lib/feature-selections/actions";

import {siteConfig} from "../../config";
import {VIEW_MAP_ONLY} from "../../config/constants/app";
import {FEATURE_SELECTIONS} from "../../config/constants/controllers";
import {FEATURE_SELECTION_HIGHLIGHT} from "../../config/feature/selections";
import scrollToElementTop from "../../helpers/scroll-to-element-top";
import {setLastListScrollPosition, setView} from "../../store/actions";

function getDocumentScroll(): number {
	return (
		window.document.documentElement.scrollTop ||
		window.document.body.scrollTop ||
		0
	);
}

function scrollToMapTop(offsetTop = 0, immediate = false): void {
	scrollToElementTop(".ms3-map-wrapper", offsetTop, immediate);
}

/**
 * Historic factory used by {@link withKeyboard}. Prefer {@link useSelectFeature}
 * inside React list components.
 */
export default function createSelectFeature(
	selectedOnly: boolean,
	selectionBehavior: Record<string, string>,
	selectionBehaviorSelection: string,
	view: string,
	dispatch: Dispatch<any>,
) {
	return function handleFeatureSelection(featureId: string | number) {
		const actions = [
			deselectAll(FEATURE_SELECTIONS, FEATURE_SELECTION_HIGHLIGHT),
			selectExclusively(
				FEATURE_SELECTIONS,
				selectionBehaviorSelection,
				String(featureId),
			),
		];

		if (!selectedOnly && selectionBehavior[view] === "scrollToMap") {
			actions.push(setLastListScrollPosition(getDocumentScroll()));
			scrollToMapTop(siteConfig.topOffsetForView(view));
		} else if (selectionBehavior[view] === "showInMapOnlyView") {
			actions.push(setLastListScrollPosition(getDocumentScroll()));
			actions.push(setView(VIEW_MAP_ONLY));
		}

		dispatch(batchActions(actions));
	};
}
