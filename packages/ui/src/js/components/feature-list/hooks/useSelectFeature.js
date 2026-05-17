import {useMemo} from "react";
import {useSelector} from "react-redux";

import {batchActions} from "redux-batched-actions";

import {
	deselectAll,
	selectExclusively,
} from "@mapsight/core/lib/feature-selections/actions";

import {VIEW_MAP_ONLY} from "../../../config/constants/app.ts";
import {FEATURE_SELECTIONS} from "../../../config/constants/controllers.ts";
import {FEATURE_SELECTION_HIGHLIGHT} from "../../../config/feature/selections.ts";
import {setLastListScrollPosition, setView} from "../../../store/actions.ts";
import {
	listUiOptionSelectedOnlySelector,
	listUiOptionSelectionBehaviorSelector,
	listUiOptionSelectionSelectionSelector,
	viewSelector,
} from "../../../store/selectors.ts";
import {
	APP_EVENT_SCROLL_TO_MAP,
	useAppChannelDispatchEvent,
} from "../../helping/app-channel.tsx";

const getDocumentScroll = () =>
	window.document.documentElement.scrollTop ||
	window.document.body.scrollTop ||
	0;

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
			function selectFeatureInList(featureId) {
				const actions = [
					deselectAll(
						FEATURE_SELECTIONS,
						FEATURE_SELECTION_HIGHLIGHT,
					),
					selectExclusively(
						FEATURE_SELECTIONS,
						selectionBehaviorSelection,
						featureId,
					),
				];

				if (
					!showSelectedOnly &&
					selectionBehavior[view] === "scrollToMap"
				) {
					actions.push(
						setLastListScrollPosition(getDocumentScroll()),
					);
					setTimeout(
						() =>
							appChannelDispatch(
								new Event(APP_EVENT_SCROLL_TO_MAP),
							),
						10,
					);
				} else if (selectionBehavior[view] === "showInMapOnlyView") {
					actions.push(
						setLastListScrollPosition(getDocumentScroll()),
					); // hier auch speichern, damit auch hier das close des poi die scroll-position wiederherstellt
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
