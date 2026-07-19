import type {
	ComponentType,
	ElementType,
	MouseEvent as ReactMouseEvent,
	ReactNode,
} from "react";
import {Fragment, memo, useRef} from "react";

import getFeatureProperty from "../../helpers/get-feature-property";
import type {MapsightUiFeature} from "../../types";
import FeatureDetailsContent from "../feature-details-content";
import getOverrideListHtml from "./get-override-list-html";
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

/**
 * Hook-free shell: branch before any hooks so only override-html rows mount a
 * component that owns wrapper click handling (historic FeatureSelectButton skip).
 */
function FeatureListItem(props: FeatureListItemProps) {
	const overrideListHtml = getOverrideListHtml(props.feature);
	if (overrideListHtml) {
		return (
			<FeatureListItemOverrideHtml {...props} html={overrideListHtml} />
		);
	}
	return <FeatureListItemStandard {...props} />;
}

type FeatureListItemOverrideHtmlProps = FeatureListItemProps & {
	html: string;
};

function FeatureListItemOverrideHtml({
	as: T = "div",
	showFeatureListInfo,
	feature,
	selectFeature,
	deselectFeatures,
	enableKeyboardControl,
	html,
}: FeatureListItemOverrideHtmlProps) {
	const {
		selectOnClick,
		deselectOnClick,
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

	if (hidden) {
		return null;
	}

	const isWrapperComponent = typeof T !== "string";
	const interactive = selectOnClick === true || deselectOnClick;
	const selectable =
		selectOnClick === true || (isSelected && deselectOnClick);

	const onClick = (event: ReactMouseEvent) => {
		if (event.button === 1 || event.metaKey || event.ctrlKey) {
			return;
		}
		event.preventDefault();
		if (isSelected && deselectOnClick) {
			deselectFeatures?.(feature.id);
		} else if (selectOnClick === true) {
			selectFeature?.(feature.id, {keyboard: false});
		}
	};

	return (
		<T
			{...(isWrapperComponent ? {feature} : null)}
			ref={ref}
			className={
				"ms3-list__item " +
				(isSelected ? " ms3-list__item--selected" : "") +
				(isPreselected ? " ms3-list__item--preselected" : "") +
				(isHighlighted ? " ms3-list__item--highlight" : "") +
				(showDetails ? " ms3-list__item--has-details" : "") +
				(showFeatureListInfo ? " ms3-list__item--has-info" : "") +
				(interactive ? " ms3-list__item--selectable" : "") +
				(ref.current?.className.includes("focus-visible")
					? " focus-visible"
					: "")
			}
			tabIndex={interactive ? -1 : undefined}
			role={selectable ? "button" : undefined}
			onClick={selectable ? onClick : undefined}
			dangerouslySetInnerHTML={{__html: html}}
		/>
	);
}

function FeatureListItemStandard({
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

	if (hidden) {
		return null;
	}

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
