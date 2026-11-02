import {useCallback, useContext, useMemo, useSyncExternalStore} from "react";
import {
	ReactReduxContext,
	type ReactReduxContextValue,
	useSelector,
} from "react-redux";

import type {RootStateSlice} from "../../../store/selectors";
import {isViewMobile, viewSelector} from "../../../store/selectors";
import type {MapsightUiFeature, MapsightUiView} from "../../../types";
import {useFeatureListContext} from "../../feature-list/context";
import {
	createIsHighlightedSelector,
	createIsPreselectedSelector,
	createIsSelectedSelector,
	hasSelectSelectionSelector,
} from "./feature-list-item-selection-selectors";

const noSelectionSelector = () => false;
const unsubscribeNothing = () => {};
const subscribeToNoChanges = () => unsubscribeNothing;

function useFeatureListView(contextView: MapsightUiView | undefined) {
	const reduxContext = useContext(
		ReactReduxContext,
	) as ReactReduxContextValue<RootStateSlice> | null;
	if (!reduxContext) {
		throw new Error("Feature list rows require a React-Redux Provider");
	}
	const {store, subscription, getServerState} = reduxContext;
	const getSnapshot = useCallback(
		() => contextView ?? viewSelector(store.getState()),
		[contextView, store],
	);
	const getServerSnapshot = useCallback(
		() => contextView ?? viewSelector((getServerState ?? store.getState)()),
		[contextView, getServerState, store],
	);

	// Keep old custom contexts and direct hook callers responsive, with the
	// same nested ordering and hydration snapshot as React-Redux selectors.
	return useSyncExternalStore(
		contextView === undefined
			? subscription.addNestedSub
			: subscribeToNoChanges,
		getSnapshot,
		getServerSnapshot,
	);
}

export default function useFeatureListItemState(
	feature: MapsightUiFeature,
	// Deep imports are published too. Preserve the global hasSelection result
	// by default; built-in rows only need it for selected-only visibility.
	{observeGlobalSelection = true}: {observeGlobalSelection?: boolean} = {},
) {
	const {
		view: contextView,
		listUiOptions: {
			selectionBehavior,
			showSelectedOnly,
			detailsInList,
			selectOnClick,
			deselectOnClick,
			highlightOnMouse,
		},
	} = useFeatureListContext();
	const view = useFeatureListView(contextView);
	const isMobile = isViewMobile(view);

	const isSelected = useSelector(createIsSelectedSelector(feature.id));
	const isPreselected = useSelector(createIsPreselectedSelector(feature.id));
	const isHighlighted = useSelector(createIsHighlightedSelector(feature.id));
	// Global selection only affects rows when it controls their visibility.
	// Keep the hook unconditional so changing showSelectedOnly stays supported.
	const hasSelection = useSelector(
		observeGlobalSelection || showSelectedOnly
			? hasSelectSelectionSelector
			: noSelectionSelector,
	);

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
			hasSelection,
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
