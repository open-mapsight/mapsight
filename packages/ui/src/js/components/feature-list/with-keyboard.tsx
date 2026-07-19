import {
	type ComponentType,
	type KeyboardEvent as ReactKeyboardEvent,
	createElement,
	useMemo,
} from "react";
import {useDispatch, useSelector} from "react-redux";

import type {Dispatch} from "@reduxjs/toolkit";

import {selectExclusively} from "@mapsight/core/lib/feature-selections/actions";
import type {State} from "@mapsight/core/types";

import {FEATURE_SELECTIONS} from "../../config/constants/controllers";
import {FEATURE_SELECTION_PRESELECT} from "../../config/feature/selections";
import {
	createSelectionIndexSelector,
	listUiOptionSelectedOnlySelector,
	listUiOptionSelectionBehaviorSelector,
	listUiOptionSelectionSelectionSelector,
	listUiScrollToItemOnPreselectSelector,
	viewSelector,
} from "../../store/selectors";
import type {MapsightUiFeature} from "../../types";
import createSelectFeature from "./create-select-feature";

type WithKeyboardProps = {
	filteredFeatures?: MapsightUiFeature[];
	tabIndex?: number;
	itemProps?: unknown;
	enableCursor?: boolean;
	onKeyDown?: (ev: ReactKeyboardEvent) => void;
};

/**
 * Historic HOC that wires arrow-key preselect / Enter selection onto a
 * scrolling container.
 *
 * @deprecated Prefer list-internal keyboard navigation. Removed in the next
 *   major of `@mapsight/ui`.
 */
export function withKeyboard<P extends WithKeyboardProps>(
	Component: ComponentType<P>,
): ComponentType<P> {
	function Wrapped({enableCursor: pEC, ...props}: P) {
		const {filteredFeatures, tabIndex, itemProps} = props;
		const dispatch = useDispatch();
		const selectionBehavior = useSelector(
			listUiOptionSelectionBehaviorSelector,
		);
		const selectionBehaviorSelection = useSelector(
			listUiOptionSelectionSelectionSelector,
		);
		const selectedOnly = useSelector(listUiOptionSelectedOnlySelector);
		const view = useSelector(viewSelector);
		const scrollToItemOnPreselect = useSelector(
			listUiScrollToItemOnPreselectSelector,
		);
		const enableCursor =
			pEC ||
			typeof itemProps === "undefined" ||
			Boolean(scrollToItemOnPreselect);

		const featureIds = useMemo(
			() =>
				!enableCursor || !filteredFeatures
					? undefined
					: filteredFeatures.map((f) => f.id),
			[enableCursor, filteredFeatures],
		);
		const featureIdKeys = useMemo(
			() => featureIds?.map((id) => String(id)),
			[featureIds],
		);
		const selectionIndexSelector = useMemo(
			() =>
				featureIdKeys &&
				createSelectionIndexSelector(
					featureIdKeys,
					FEATURE_SELECTION_PRESELECT,
				),
			[featureIdKeys],
		);
		const selectionIndex = useSelector((state: State) =>
			selectionIndexSelector ? selectionIndexSelector(state) : -1,
		);
		const onKeyDown = useMemo(
			() =>
				featureIds?.length
					? (ev: ReactKeyboardEvent) =>
							handleKeyboardEvent(
								ev,
								featureIds,
								selectionIndex,
								Boolean(selectedOnly),
								selectionBehavior as Record<string, string>,
								selectionBehaviorSelection,
								view,
								dispatch,
							)
					: undefined,
			[
				featureIds,
				selectionIndex,
				selectedOnly,
				selectionBehavior,
				selectionBehaviorSelection,
				view,
				dispatch,
			],
		);

		return createElement(Component, {
			...(props as P),
			tabIndex: tabIndex || onKeyDown ? 0 : undefined,
			onKeyDown,
		});
	}

	const name = Component.displayName || Component.name || "Unknown";
	Wrapped.displayName = `withKeyboard(${name})`;
	return Wrapped as ComponentType<P>;
}

const moveNext = (
	sourceIds: Array<string | number>,
	idx: number,
	dispatch: Dispatch<any>,
) => {
	if (!sourceIds.length || idx >= sourceIds.length - 1) {
		return;
	}
	const targetId = idx < 0 ? sourceIds[0] : sourceIds[idx + 1];
	if (targetId == null) {
		return;
	}
	dispatch(
		selectExclusively(
			FEATURE_SELECTIONS,
			FEATURE_SELECTION_PRESELECT,
			String(targetId),
		),
	);
};

const movePrev = (
	sourceIds: Array<string | number>,
	idx: number,
	dispatch: Dispatch<any>,
) => {
	if (!sourceIds.length || idx >= sourceIds.length || idx === 0) {
		return;
	}
	const targetId =
		idx < 0 ? sourceIds[sourceIds.length - 1] : sourceIds[idx - 1];
	if (targetId == null) {
		return;
	}
	dispatch(
		selectExclusively(
			FEATURE_SELECTIONS,
			FEATURE_SELECTION_PRESELECT,
			String(targetId),
		),
	);
};

const select = (
	sourceIds: Array<string | number>,
	idx: number,
	selectedOnly: boolean,
	selectionBehavior: Record<string, string>,
	selectionBehaviorSelection: string,
	view: string,
	dispatch: Dispatch<any>,
) => {
	if (!sourceIds.length || idx >= sourceIds.length) {
		return;
	}
	const targetId = idx < 0 ? sourceIds[0] : sourceIds[idx];
	if (targetId == null) {
		return;
	}
	createSelectFeature(
		selectedOnly,
		selectionBehavior,
		selectionBehaviorSelection,
		view,
		dispatch,
	)(targetId);
};

function handleKeyboardEvent(
	ev: ReactKeyboardEvent,
	featureIds: Array<string | number>,
	selectionIndex: number,
	selectedOnly: boolean,
	selectionBehavior: Record<string, string>,
	selectionBehaviorSelection: string,
	view: string,
	dispatch: Dispatch<any>,
) {
	if (ev.key === "ArrowUp") {
		movePrev(featureIds, selectionIndex, dispatch);
		ev.preventDefault();
	} else if (ev.key === "ArrowDown") {
		moveNext(featureIds, selectionIndex, dispatch);
		ev.preventDefault();
	} else if (
		ev.key === "Enter" &&
		(ev.target as HTMLElement).tagName !== "A"
	) {
		select(
			featureIds,
			selectionIndex,
			selectedOnly,
			selectionBehavior,
			selectionBehaviorSelection,
			view,
			dispatch,
		);
		ev.preventDefault();
	}
}

export default withKeyboard;
