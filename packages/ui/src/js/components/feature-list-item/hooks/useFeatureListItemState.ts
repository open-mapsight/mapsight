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

	return useMemo(() => {
		const behavior = selectionBehavior?.[view];
		const expandInList = behavior === "expandInList";
		const detailsInline = !!(detailsInList || expandInList);
		// Rendering details in the list does not make a map-navigation action
		// a disclosure (e.g. mobile round tours also set detailsInList).
		const detailsDisclosure =
			detailsInline &&
			behavior !== "showInMapOnlyView" &&
			(behavior !== "scrollToMap" || !!showSelectedOnly);

		return {
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
			// Keep explicit detailsInList rendering independent of the action.
			detailsInline,
			detailsDisclosure,
			showDetails: !!(isSelected && (detailsInList || expandInList)),
			scrollOnSelection: !!(expandInList && !showSelectedOnly),
		};
	}, [
		deselectOnClick,
		detailsInList,
		hasSelection,
		highlightOnMouse,
		isHighlighted,
		isMobile,
		isPreselected,
		isSelected,
		selectOnClick,
		selectionBehavior,
		showSelectedOnly,
		view,
	]);
}
