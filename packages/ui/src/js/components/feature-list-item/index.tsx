import type {
	ComponentType,
	ElementType,
	MouseEvent as ReactMouseEvent,
	ReactNode,
} from "react";
import {Fragment, memo, useCallback, useRef} from "react";

import getFeatureProperty from "../../helpers/get-feature-property";
import type {MapsightUiFeature, MapsightUiFeatureProperty} from "../../types";
import FeatureDetailsContent from "../feature-details-content";
import FeatureListItemHead, {type FeatureListItemHeadProps} from "./head";
import useFeatureListItemScrollAndFocus from "./hooks/useFeatureListItemScrollAndFocus";
import useFeatureListItemState from "./hooks/useFeatureListItemState";
import FeatureListIcon from "./icon";
import type {
	FeatureListItemDistanceLabelProps,
	FeatureListItemInteractionProps,
} from "./types";

function getMainContentForFeature(feature: MapsightUiFeature): ReactNode {
	const listName = getFeatureProperty(feature, "listName");
	const name = getFeatureProperty(feature, "name");
	return (listName || name) as ReactNode;
}

export type FeatureListItemProps = FeatureListItemInteractionProps & {
	as?: ElementType;
	partAs?: ElementType;
	headAs?: ComponentType<FeatureListItemHeadProps> | null;
	contentAs?: ElementType | null;
	distanceLabelAs?: ComponentType<FeatureListItemDistanceLabelProps> | null;
	showFeatureListInfo?: boolean;
	feature: MapsightUiFeature;
	enableKeyboardControl?: boolean;
};

function FeatureListItem({
	as: T = "div",
	partAs: PartT = "span",
	headAs: HeadT = FeatureListItemHead,
	contentAs: ContentT = Fragment,
	distanceLabelAs: DistanceLabelT = null,
	showFeatureListInfo,
	feature,
	selectFeature,
	deselectFeatures,
	enableKeyboardControl,
}: FeatureListItemProps) {
	const {
		selectOnClick,
		deselectOnClick,
		highlightOnMouse,
		hidden,
		isSelected,
		isPreselected,
		isHighlighted,
		showDetails,
		scrollOnSelection,
	} = useFeatureListItemState(feature);

	const ref = useRef<HTMLElement | null>(null);

	useFeatureListItemScrollAndFocus(
		ref,
		showDetails,
		isPreselected && !isSelected,
		{
			scrollOnSelection: scrollOnSelection,
			scrollOnPreselection: undefined,
			enableKeyboardControl: enableKeyboardControl,
		},
	);

	// Pre-OSS put select/deselect on the item wrapper when `overrideListHtml`
	// short-circuits past FeatureListItemHead / FeatureSelectButton.
	const onOverrideListHtmlClick = useCallback(
		(event: ReactMouseEvent) => {
			if (event.button === 1 || event.metaKey || event.ctrlKey) {
				return;
			}
			event.preventDefault();
			if (isSelected && deselectOnClick) {
				deselectFeatures?.(feature.id);
			} else if (selectOnClick === true) {
				selectFeature?.(feature.id, {keyboard: false});
			}
		},
		[
			deselectFeatures,
			deselectOnClick,
			feature.id,
			isSelected,
			selectFeature,
			selectOnClick,
		],
	);

	if (hidden) {
		return null;
	}

	// if render type is not a native element but presumably a React component,
	// pass some extra props to be used by said component
	const isWrapperComponent = typeof T !== "string";

	const wrapperProps: Record<string, unknown> = {
		...(isWrapperComponent ? {feature} : null),
		ref: ref,
		className:
			"ms3-list__item " +
			(isSelected ? " ms3-list__item--selected" : "") +
			(isPreselected ? " ms3-list__item--preselected" : "") +
			(isHighlighted ? " ms3-list__item--highlight" : "") +
			(showDetails ? " ms3-list__item--has-details" : "") +
			(showFeatureListInfo ? " ms3-list__item--has-info" : "") +
			(selectOnClick === true || deselectOnClick
				? " ms3-list__item--selectable"
				: "") +
			(ref.current?.className.includes("focus-visible")
				? " focus-visible"
				: ""),
	};

	// Legacy: feature may name an alternate HTML property via `__overrideListHtmlProp`.
	const overrideListHtmlPropertyRaw = getFeatureProperty(
		feature,
		"__overrideListHtmlProp",
		"overrideListHtml",
	);
	const overrideListHtmlProperty = (
		typeof overrideListHtmlPropertyRaw === "string" &&
		overrideListHtmlPropertyRaw.length > 0
			? overrideListHtmlPropertyRaw
			: "overrideListHtml"
	) as MapsightUiFeatureProperty;
	const overrideListHtmlRaw = getFeatureProperty(
		feature,
		overrideListHtmlProperty,
	);
	const overrideListHtml =
		typeof overrideListHtmlRaw === "string" &&
		overrideListHtmlRaw.length > 0
			? overrideListHtmlRaw
			: undefined;

	// Host wrappers (e.g. StartPageItem / LinkItem) expect the HTML on the
	// wrapper element itself. Mirror historic wrapper interaction props so the
	// row stays selectable without FeatureSelectButton.
	if (overrideListHtml) {
		if (selectOnClick === true || deselectOnClick) {
			wrapperProps.tabIndex = -1;
		}
		if (selectOnClick === true || (isSelected && deselectOnClick)) {
			wrapperProps.role = "button";
			wrapperProps.onClick = onOverrideListHtmlClick;
		}

		return (
			<T
				{...wrapperProps}
				dangerouslySetInnerHTML={{__html: overrideListHtml}}
			/>
		);
	}

	let info: ReactNode = null;
	if (showFeatureListInfo) {
		info = (
			<PartT
				className="ms3-list__info"
				dangerouslySetInnerHTML={{
					__html: getFeatureProperty(feature, "listInformation"),
				}}
			/>
		);
	}

	const showInfoInHead = selectOnClick === true;

	let head: ReactNode | undefined;
	if (HeadT) {
		head = (
			<Fragment>
				<FeatureListIcon
					as="span"
					mapsightIconId={
						getFeatureProperty(feature, "mapsightIconId") as
							string | undefined
					}
				/>
				<PartT
					className={`ms3-list__main${
						selectOnClick || deselectOnClick
							? " ms3-list__main--selectable"
							: ""
					}${DistanceLabelT ? " ms3-list__main--with-distance" : ""}`}
				>
					<PartT className="ms3-list__main-title">
						{getMainContentForFeature(feature)}
					</PartT>
					{DistanceLabelT && <DistanceLabelT feature={feature} />}
				</PartT>
				{showInfoInHead && info}
			</Fragment>
		);
	}

	let details: ReactNode = null;
	if (showDetails) {
		details = (
			<PartT className="ms3-list__details">
				<FeatureDetailsContent feature={feature} />
			</PartT>
		);
	}

	return (
		<T {...wrapperProps}>
			{HeadT && (
				<HeadT
					feature={feature}
					isSelected={isSelected}
					isHighlighted={isHighlighted}
					highlightOnMouse={highlightOnMouse}
					selectOnClick={selectOnClick}
					deselectOnClick={deselectOnClick}
					selectFeature={selectFeature}
					deselectFeatures={deselectFeatures}
					className="ms3-list__item__head"
				>
					{head}
				</HeadT>
			)}
			{ContentT && (
				<ContentT>
					{!showInfoInHead && info}
					{details}
				</ContentT>
			)}
		</T>
	);
}

export default memo(FeatureListItem);
