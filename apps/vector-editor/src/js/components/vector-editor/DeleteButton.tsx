import type React from "react";
import {useMemo} from "react";
import {useDispatch, useSelector} from "react-redux";

import {type UnknownAction, createSelector} from "@reduxjs/toolkit";
import {batchActions} from "redux-batched-actions";

import {deselectAll} from "@mapsight/core/lib/feature-selections/actions";
import {
	createFeatureSelectionSelector,
	getFilteredFeatures,
} from "@mapsight/core/lib/feature-selections/selectors";
import {removeFeatures} from "@mapsight/core/lib/feature-sources/actions";
import type EditorMixin from "@mapsight/core/mixins/EditorMixin";

import type {ButtonProps} from "./Button.tsx";
import Button from "./Button.tsx";
import ButtonBadge from "./ButtonBadge.tsx";

function DeleteButton({
	editor,
	badgeAs: U = ButtonBadge,
	className,
	...props
}: ButtonProps & {
	editor: EditorMixin;
	badgeAs?: React.ElementType;
}) {
	const dispatch = useDispatch();
	const featureSelectionsControllerName =
		editor.controllers.featureSelections!;
	const featureIds = useSelector(
		useMemo(() => {
			const selectionSelector = createFeatureSelectionSelector(
				featureSelectionsControllerName,
				"select",
			);
			return createSelector(
				[selectionSelector],
				(selectSelection) => getFilteredFeatures(selectSelection) || [],
			);
		}, [featureSelectionsControllerName]),
	);
	const enabled = featureIds.length;
	const number = enabled ? featureIds.length : null;

	const handleClick = () => {
		dispatch(
			batchActions([
				removeFeatures(
					editor.controllers.featureSources!,
					editor.ids.featureSource!,
					featureIds,
				),
				deselectAll(editor.controllers.featureSelections!, "select"),
			]) as unknown as UnknownAction,
		);
	};

	return (
		<Button
			disabled={!enabled}
			className={`ms3-vector-delete-button ms3-vector-editor-button--grouped ${
				!enabled
					? "ms3-vector-delete-button--disabled"
					: "ms3-vector-delete-button--enabled"
			} ${className}`}
			onClick={handleClick}
			{...props}
			icon="icon-delete"
			label="Ausgewählte Elemente löschen"
		>
			{U && number ? <U>{number}</U> : null}
		</Button>
	);
}

export default DeleteButton;
