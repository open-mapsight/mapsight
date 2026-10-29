import {memo} from "react";
import {useSelector} from "react-redux";

import {isViewMobileOrMapOnlySelector} from "../../store/selectors";
import CitationsTrigger from "../citations/citations-trigger";
import Logo from "./logo";

function InfoOverlayLeft() {
	const isMobileOrMapOnly = useSelector(isViewMobileOrMapOnlySelector);

	return (
		<div className="ms3-info-overlay__area ms3-info-overlay__area--left">
			{!isMobileOrMapOnly && (
				<div className="ms3-info-overlay__logo ms3-info-overlay__desktop-content">
					<Logo />
				</div>
			)}

			<CitationsTrigger />
		</div>
	);
}

export default memo(InfoOverlayLeft);
