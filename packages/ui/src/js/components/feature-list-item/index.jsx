import {Fragment, useRef} from "react";

import getFeatureProperty from "../../helpers/get-feature-property";
import FeatureDetailsContent from "../feature-details-content";

import FeatureListItemHead from "./head";
import useFeatureListItemScrollAndFocus from "./hooks/useFeatureListItemScrollAndFocus";
import useFeatureListItemState from "./hooks/useFeatureListItemState";

import FeatureListIcon from "./icon";

function getMainContentForFeature(feature) {
	const listName = getFeatureProperty(feature, "listName");
	const name = getFeatureProperty(feature, "name");
	return listName || name;
}

function FeatureListItem({
	as: T = "div",
	partAs: PartT = "span",
	headAs: HeadT = FeatureListItemHead,
	contentAs: ContentT = Fragment,
	showFeatureListInfo,
	feature,
	selectFeature,
	deselectFeatures,
	enableKeyboardControl,
}) {
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
		scrollOnPreselection,
	} = useFeatureListItemState(feature);

	/** @type {React.MutableRefObject<HTMLElement | null>} */
	const ref = useRef(null);

	useFeatureListItemScrollAndFocus(
		ref,
		showDetails,
		isPreselected && !isSelected,
		{
			scrollOnSelection: scrollOnSelection,
			scrollOnPreselection: scrollOnPreselection,
			enableKeyboardControl: enableKeyboardControl,
		},
	);

	if (hidden) {
		return null;
	}

	// if render type is not a native element but presumably a React component,
	// pass some extra props to be used by said component
	const isWrapperComponent = typeof T !== "string";

	const wrapperProps = {
		...(isWrapperComponent
			? {
					/* TODO: Which props? */
				}
			: null),
		ref: ref,
		className:
			"ms3-list__item " +
			(isSelected ? " ms3-list__item--selected" : "") +
			(isPreselected ? " ms3-list__item--preselected" : "") +
			(isHighlighted ? " ms3-list__item--highlight" : "") +
			(showDetails ? " ms3-list__item--has-details" : "") +
			(showFeatureListInfo ? " ms3-list__item--has-info" : "") +
			(ref.current?.className.includes("focus-visible")
				? " focus-visible"
				: ""),
	};

	let info = null;
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

	let head;
	let headHtml;
	if (HeadT) {
		// NOTE(PG): Legacy code to support list HTML from the source. Should
		//            probably be deprecated and replaced by a custom component
		headHtml = getFeatureProperty(feature, "overrideListHtml");

		if (!headHtml) {
			head = (
				<Fragment>
					<FeatureListIcon
						as="span"
						mapsightIconId={getFeatureProperty(
							feature,
							"mapsightIconId",
						)}
					/>
					<PartT
						className={`ms3-list__main${
							selectOnClick || deselectOnClick
								? " ms3-list__main--selectable"
								: ""
						}`}
					>
						{getMainContentForFeature(feature)}
					</PartT>
					{showInfoInHead && info}
				</Fragment>
			);
		}
	}

	let details = null;
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
					dangerouslySetInnerHTML={
						headHtml ? {__html: headHtml} : undefined
					}
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

export default FeatureListItem;
