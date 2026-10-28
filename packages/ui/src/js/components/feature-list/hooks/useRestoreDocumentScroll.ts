import {useEffect} from "react";

import type {View} from "../../../config/constants/app";
import {isViewFullscreen, isViewMobile} from "../../../store/selectors";

export default function useRestoreDocumentScroll(
	view: View,
	scrollPosition?: number | null,
) {
	useEffect(() => {
		if ((isViewMobile(view) || isViewFullscreen(view)) && scrollPosition) {
			window.document.documentElement.scrollTop = scrollPosition;
			window.document.body.scrollTop = scrollPosition;
		}
	}, [view, scrollPosition]);
}
