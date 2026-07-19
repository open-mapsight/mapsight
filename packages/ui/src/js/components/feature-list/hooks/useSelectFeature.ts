import {useMemo} from "react";
import {useSelector} from "react-redux";

import {batchActions} from "redux-batched-actions";

import {
	deselectAll,
	selectExclusively,
} from "@mapsight/core/lib/feature-selections/actions";

import {VIEW_MAP_ONLY} from "../../../config/constants/app";
import {FEATURE_SELECTIONS} from "../../../config/constants/controllers";
import {FEATURE_SELECTION_HIGHLIGHT} from "../../../config/feature/selections";
import {consumeDocumentScrollForSelection} from "../../../helpers/document-scroll";
import {setLastListScrollPosition, setView} from "../../../store/actions";
import {
	listUiOptionSelectedOnlySelector,
	listUiOptionSelectionBehaviorSelector,
	listUiOptionSelectionSelectionSelector,
	viewSelector,
} from "../../../store/selectors";
import type {MapsightUiFeatureId} from "../../../types";
import {
	APP_EVENT_SCROLL_TO_MAP,
	useAppChannelDispatchEvent,
} from "../../helping/app-channel";

export default function useSelectFeature() {
	const appChannelDispatch = useAppChannelDispatchEvent();
	const selectionBehavior = useSelector(
		listUiOptionSelectionBehaviorSelector,
	);
	const selectionBehaviorSelection = useSelector(
		listUiOptionSelectionSelectionSelector,
	);
	const showSelectedOnly = useSelector(listUiOptionSelectedOnlySelector);
	const view = useSelector(viewSelector);

	return useMemo(
		() =>
			function selectFeatureInList(featureId: MapsightUiFeatureId) {
				const actions = [
					deselectAll(
						FEATURE_SELECTIONS,
						FEATURE_SELECTION_HIGHLIGHT,
					),
					selectExclusively(
						FEATURE_SELECTIONS,
						selectionBehaviorSelection,
						String(featureId),
					),
				];

				if (
					!showSelectedOnly &&
					selectionBehavior[view] === "scrollToMap"
				) {
					actions.push(
						setLastListScrollPosition(
							consumeDocumentScrollForSelection(),
						),
					);
					setTimeout(
						() =>
							appChannelDispatch(
								new Event(APP_EVENT_SCROLL_TO_MAP),
							),
						10,
					);
				} else if (selectionBehavior[view] === "showInMapOnlyView") {
					// Capture at pointerdown (see FeatureSelectButton) so click
					// scroll-into-view does not shrink the restored position.
					actions.push(
						setLastListScrollPosition(
							consumeDocumentScrollForSelection(),
						),
					);
					actions.push(setView(VIEW_MAP_ONLY));
				}

				return batchActions(actions);
			},
		[
			appChannelDispatch,
			showSelectedOnly,
			selectionBehavior,
			selectionBehaviorSelection,
			view,
		],
	);
}
