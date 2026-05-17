import {useLayoutEffect} from "react";

import {siteConfig} from "../../../config";
import {VIEW_MOBILE} from "../../../config/constants/app";
import makeSticky from "../../../helpers/sticky";
import {useAppChannelDispatchEvent} from "../../helping/app-channel";

export function useMakeHeaderSticky(
	enabled,
	scrollContainerRef,
	stickyElementRef,
	view,
) {
	const dispatchAppChannelEvent = useAppChannelDispatchEvent();

	useLayoutEffect(() => {
		if (enabled && scrollContainerRef.current && stickyElementRef.current) {
			const stickyElement = stickyElementRef.current;

			return makeSticky(
				stickyElement,
				// use `view === VIEW_MOBILE` here because `isViewMobile` is checking view
				// for mobile or mapOnly
				view === VIEW_MOBILE ? window : scrollContainerRef.current,
				{
					offset: siteConfig.topOffsetForView(view),
					onChange: () => {
						dispatchAppChannelEvent(
							new CustomEvent("stickyHeaderChange", {
								stickyElement: stickyElement,
							}),
						);
					},
				},
			);
		}

		return undefined;
	});
}
