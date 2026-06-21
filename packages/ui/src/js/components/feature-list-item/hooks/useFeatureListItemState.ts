import {useMemo} from "react";
import {useSelector} from "react-redux";

import {getFilteredFeatures} from "@mapsight/core/lib/feature-selections/selectors";

import {isViewMobile, viewSelector} from "../../../store/selectors";
import type {MapsightUiFeature} from "../../../types";
import {useFeatureListContext} from "../../feature-list/context";

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
		state: {selectSelection, preselectSelection, highlightSelection},
	} = useFeatureListContext();

	const selectSelectionFeatures = useMemo(
		() => getFilteredFeatures(selectSelection) || [],
		[selectSelection],
	);
	const hasSelection = selectSelectionFeatures?.length > 0;
	const isSelected = useMemo(
		() => selectSelectionFeatures.includes(feature.id),
		[feature.id, selectSelectionFeatures],
	);
	const isPreselected = useMemo(
		() => !!getFilteredFeatures(preselectSelection)?.includes(feature.id),
		[feature.id, preselectSelection],
	);
	const isHighlighted = useMemo(
		() => !!getFilteredFeatures(highlightSelection)?.includes(feature.id),
		[feature.id, highlightSelection],
	);

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
