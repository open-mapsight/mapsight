import {translate} from "../../helpers/i18n";

export default function MapOverlayLogo() {
	return (
		<div className="ms3-logo">
			<span className="ms3-visuallyhidden">
				{translate("ui.map-overlay.logo.copyright")}
			</span>
		</div>
	);
}
