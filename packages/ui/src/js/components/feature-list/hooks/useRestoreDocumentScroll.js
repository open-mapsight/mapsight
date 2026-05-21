import {useEffect} from "react";

import {isViewFullscreen, isViewMobile} from "../../../store/selectors";

export default function useRestoreDocumentScroll(view, scrollPosition) {
	useEffect(() => {
		if ((isViewMobile(view) || isViewFullscreen(view)) && scrollPosition) {
			window.document.documentElement.scrollTop = scrollPosition;
			window.document.body.scrollTop = scrollPosition;
		}
	}, [view, scrollPosition]);
}
