import {useDispatch} from "react-redux";

import {translate} from "../../helpers/i18n";
import {setOverlayModalVisible} from "../../store/actions";

export default function MapOverlayLogo() {
	const dispatch = useDispatch();
	return (
		<button
			type="button"
			className="ms3-logo"
			aria-label={translate("ui.map-overlay.info.open")}
			onClick={() => dispatch(setOverlayModalVisible(true))}
		>
			<span className="ms3-visuallyhidden">
				{translate("ui.map-overlay.logo.copyright")}
			</span>
		</button>
	);
}
