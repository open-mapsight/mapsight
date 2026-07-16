import type {ComponentType, HTMLAttributes, ReactNode} from "react";
import {useCallback} from "react";
import {useDispatch} from "react-redux";

import {
	deselectAll,
	selectExclusively,
} from "@mapsight/core/lib/feature-selections/actions";

import {FEATURE_SELECTIONS} from "../../config/constants/controllers";
import {FEATURE_SELECTION_HIGHLIGHT} from "../../config/feature/selections";
import getFeatureProperty from "../../helpers/get-feature-property";
import type {MapsightUiFeature, MapsightUiFeatureId} from "../../types";
import FeatureSelectButtonUntyped from "../feature-select-button";
import type {
	FeatureListItemInteractionProps,
	ListSelectOnClick,
	SelectFeatureHandler,
} from "./types";

type FeatureSelectButtonProps = {
	tabIndex?: number;
	className?: string;
	featureId: MapsightUiFeatureId;
	isSelected?: boolean;
	selectOnClick?: ListSelectOnClick;
	deselectOnClick?: boolean;
	onSelect?: SelectFeatureHandler;
	onDeselect?: SelectFeatureHandler;
	permanentLink?: string;
	children?: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "onSelect">;

const FeatureSelectButton =
	FeatureSelectButtonUntyped as ComponentType<FeatureSelectButtonProps>;

export type FeatureListItemHeadProps = FeatureListItemInteractionProps & {
	children?: ReactNode;
	feature: MapsightUiFeature;
	isSelected?: boolean;
	isHighlighted?: boolean;
	highlightOnMouse?: boolean;
	selectOnClick?: ListSelectOnClick;
	deselectOnClick?: boolean;
	className?: string;
} & HTMLAttributes<HTMLElement>;

function FeatureListItemHead({
	children,
	feature,
	isSelected = false,
	isHighlighted = false,
	highlightOnMouse = false,
	selectOnClick = false,
	deselectOnClick = false,
	selectFeature,
	deselectFeatures,
	className = "",
	...attributes
}: FeatureListItemHeadProps) {
	const permanentLink = getFeatureProperty(feature, "permanentLink") as
		string | undefined;

	const dispatch = useDispatch();
	const onFeatureHighlight = useCallback(
		() =>
			dispatch(
				selectExclusively(
					FEATURE_SELECTIONS,
					FEATURE_SELECTION_HIGHLIGHT,
					feature.id,
				),
			),
		[dispatch, feature.id],
	);
	const onFeatureUnHighlight = useCallback(
		() =>
			dispatch(
				deselectAll(FEATURE_SELECTIONS, FEATURE_SELECTION_HIGHLIGHT),
			),
		[dispatch],
	);
	if (highlightOnMouse) {
		attributes.onMouseEnter = !isSelected ? onFeatureHighlight : undefined;
		attributes.onMouseLeave = isHighlighted
			? onFeatureUnHighlight
			: undefined;
	}

	/*
	 * We support a range of interactive behaviours
	 * 1. Has some on-page click handler => <button> or <a role=button> (if it also has a permalink)
	 * 2. Does not have on-page click behaviour, but permalink => link <a>
	 * 3. Does have neither on-page click behaviour nor permalink, but should highlight on mouse => <span> with hover handlers
	 * 4. Not interactive at all => <span>
	 */

	// 1
	if (feature.id && (selectOnClick || deselectOnClick)) {
		return (
			<FeatureSelectButton
				tabIndex={-1}
				className={`${className} [ ms3-list__button ms3-list__button--selectable ]`}
				{...attributes}
				featureId={feature.id}
				isSelected={isSelected}
				selectOnClick={selectOnClick}
				deselectOnClick={deselectOnClick}
				onSelect={selectFeature}
				onDeselect={deselectFeatures}
				permanentLink={permanentLink}
			>
				{children}
			</FeatureSelectButton>
		);
	}

	// 2.
	if (permanentLink) {
		return (
			<a
				tabIndex={-1}
				href={permanentLink}
				className={`${className} [ ms3-list__link ]`}
				{...attributes}
			>
				{children}
			</a>
		);
	}

	// 3.
	if (highlightOnMouse) {
		return (
			<span
				className={`${className} [ ms3-list__button ]`}
				{...attributes}
			>
				{children}
			</span>
		);
	}

	// 4.
	return (
		<span className={className} {...attributes}>
			{children}
		</span>
	);
}

export default FeatureListItemHead;
