import type {RefObject} from "react";
import {useLayoutEffect} from "react";

import {siteConfig} from "../../../config";
import type {View} from "../../../config/constants/app";
import {VIEW_MOBILE} from "../../../config/constants/app";
import makeSticky from "../../../helpers/sticky";
import {useAppChannelDispatchEvent} from "../../helping/app-channel";

export function useMakeHeaderSticky(
	enabled: boolean,
	scrollContainerRef: RefObject<HTMLElement | null>,
	stickyElementRef: RefObject<HTMLElement | null>,
	view: View,
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
							new CustomEvent("stickyHeaderChange"),
						);
					},
				},
			);
		}

		return undefined;
	});
}
