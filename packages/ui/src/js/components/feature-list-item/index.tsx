import type {
	ComponentType,
	ElementType,
	KeyboardEvent as ReactKeyboardEvent,
	ReactNode,
} from "react";
import {Fragment, memo, useId, useRef} from "react";

import getFeatureProperty from "../../helpers/get-feature-property";
import {shouldDismissOnEscape} from "../../hooks/useOverlayDismiss";
import type {MapsightUiFeature} from "../../types";
import FeatureDetailsContent from "../feature-details-content";
import FeatureListItemHead, {type FeatureListItemHeadProps} from "./head";
import useFeatureListItemScrollAndFocus from "./hooks/useFeatureListItemScrollAndFocus";
import useFeatureListItemState from "./hooks/useFeatureListItemState";
import FeatureListIcon from "./icon";
import FeatureListInfoHtml from "./info-html";
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
		detailsInline,
		detailsDisclosure,
		showDetails,
		scrollOnSelection,
	} = useFeatureListItemState(feature);

	const ref = useRef<HTMLElement | null>(null);
	const detailsId = useId();

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
		const listInformation = getFeatureProperty(feature, "listInformation");
		info = (
			<FeatureListInfoHtml
				as={PartT}
				html={
					typeof listInformation === "string" ? listInformation : ""
				}
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
	if (detailsInline) {
		details = (
			<PartT
				id={detailsId}
				className="ms3-list__details"
				hidden={!showDetails}
			>
				{showDetails && <FeatureDetailsContent feature={feature} />}
			</PartT>
		);
	}

	return (
		<T
			{...wrapperProps}
			onKeyDown={(event: ReactKeyboardEvent) => {
				if (
					!detailsDisclosure ||
					!ContentT ||
					!showDetails ||
					!deselectFeatures ||
					!shouldDismissOnEscape(event.nativeEvent, ref.current) ||
					event.defaultPrevented
				) {
					return;
				}
				event.preventDefault();
				event.stopPropagation();
				deselectFeatures(feature.id, {keyboard: true});
				ref.current
					?.querySelector<HTMLElement>("[data-ms3-list-nav]")
					?.focus({preventScroll: true});
			}}
		>
			{HeadT && (
				<HeadT
					feature={feature}
					isSelected={isSelected}
					{...(selectOnClick || deselectOnClick
						? {
								"aria-pressed":
									detailsDisclosure && ContentT
										? undefined
										: isSelected,
								"aria-expanded":
									detailsDisclosure && ContentT
										? showDetails
										: undefined,
								"aria-controls":
									detailsDisclosure && ContentT
										? detailsId
										: undefined,
							}
						: {})}
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
