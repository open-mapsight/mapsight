import {useMemo} from "react";
import {useSelector} from "react-redux";

import {isViewMobile, viewSelector} from "../../../store/selectors";
import type {MapsightUiFeature} from "../../../types";
import {useFeatureListContext} from "../../feature-list/context";
import {
	createIsHighlightedSelector,
	createIsPreselectedSelector,
	createIsSelectedSelector,
	hasSelectSelectionSelector,
} from "./feature-list-item-selection-selectors";

export default function useFeatureListItemState(feature: MapsightUiFeature) {
	const view = useSelector(viewSelector);
	const isMobile = isViewMobile(view);
	const {
		listUiOptions: {
			selectionBehavior,
			showSelectedOnly,
			detailsInList,
			selectOnClick,
			deselectOnClick,
			highlightOnMouse,
		},
	} = useFeatureListContext();

	const isSelected = useSelector(createIsSelectedSelector(feature.id));
	const isPreselected = useSelector(createIsPreselectedSelector(feature.id));
	const isHighlighted = useSelector(createIsHighlightedSelector(feature.id));
	const hasSelection = useSelector(hasSelectSelectionSelector);

	return useMemo(
		() => ({
			selectOnClick: selectOnClick,
			deselectOnClick: !!deselectOnClick,
			highlightOnMouse: !!highlightOnMouse,
			view: view,
			isMobile: isMobile,
			hidden: !!(showSelectedOnly && hasSelection && !isSelected),
			hasSelection: hasSelection,
			isSelected: isSelected,
			isHighlighted: isHighlighted,
			isPreselected: isPreselected,
			showDetails: !!(isSelected && (isMobile || detailsInList)),
			scrollOnSelection: !!(
				selectionBehavior?.[view] === "expandInList" &&
				!showSelectedOnly
			),
		}),
		[
			deselectOnClick,
			detailsInList,
			hasSelection,
			highlightOnMouse,
			isHighlighted,
			isMobile,
			isPreselected,
			isSelected,
			selectOnClick,
			showSelectedOnly,
			selectionBehavior,
			view,
		],
	);
}
