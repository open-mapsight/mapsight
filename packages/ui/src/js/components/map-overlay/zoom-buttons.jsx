import  {memo} from "react";

import {ZOOM_IN, ZOOM_OUT} from "../../config/constants/app";

import CombinedButtons from "./combined-buttons";
import ZoomButton from "./zoom-button";

const ZoomButtons = memo(function ZoomButtons() {
	return (
		<CombinedButtons>
			<ZoomButton
				baseClass="ms3-map-overlay__button"
				additionalClasses="ms3-map-overlay__button--with-icon ms3-map-overlay__button--zoom"
				zoomModifierClassPrefix="ms3-map-overlay__button--zoom--"
				action={ZOOM_IN}
			/>
			<ZoomButton
				baseClass="ms3-map-overlay__button"
				additionalClasses="ms3-map-overlay__button--with-icon ms3-map-overlay__button--zoom"
				zoomModifierClassPrefix="ms3-map-overlay__button--zoom--"
				action={ZOOM_OUT}
			/>
		</CombinedButtons>
	);
});
export default ZoomButtons;
