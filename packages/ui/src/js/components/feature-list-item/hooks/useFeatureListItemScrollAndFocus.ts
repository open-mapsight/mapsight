import type {RefObject} from "react";
import {useEffect} from "react";

import usePrevious from "../../../hooks/usePrevious";

type FeatureListItemScrollAndFocusOptions = {
	scrollOnSelection?: boolean;
	scrollOnPreselection?: boolean;
	enableKeyboardControl?: boolean;
};

export default function useFeatureListItemScrollAndFocus(
	ref: RefObject<HTMLElement | null>,
	showDetails: boolean,
	isPreselectedOnly: boolean,
	{
		scrollOnSelection,
		scrollOnPreselection,
		enableKeyboardControl,
	}: FeatureListItemScrollAndFocusOptions,
) {
	const lastShowDetails = usePrevious(showDetails);
	const lastIsPreselectedOnly = usePrevious(isPreselectedOnly);

	useEffect(() => {
		if (typeof window === "undefined" || ref.current === null) {
			return;
		}

		/*
		 * There are two cases where we want to scroll to the item
		 * 1. On selection, if enabled and if details are expanded
		 * 2. On preselection, if enabled and only if not already selected
		 *
		 * Case 2 may occur if the project code preselects the feature without also
		 * immediately selecting it. In that case we may also want to focus the
		 * item, if enabled.
		 */
		let shouldScroll = false;
		if (scrollOnSelection && showDetails && !lastShowDetails) {
			// case 1: scroll on selection with details
			shouldScroll = true;
		} else if (
			scrollOnPreselection &&
			isPreselectedOnly &&
			!lastIsPreselectedOnly
		) {
			// case 2: scroll on preselection
			shouldScroll = true;
		}

		if (shouldScroll) {
			console.log("list item scroll");
			ref.current.scrollIntoView({block: "start", behavior: "smooth"});

			if (enableKeyboardControl) {
				console.log("list item focus");
				ref.current.focus({preventScroll: true});
			}
		}
	});
}
