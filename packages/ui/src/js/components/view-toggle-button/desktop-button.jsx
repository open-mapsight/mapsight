import ViewToggleButton from "./index.ts";

function DesktopViewToggleButton() {
	return (
		<ViewToggleButton
			baseClass="ms3-map-overlay__button"
			additionalClasses="ms3-map-overlay__button--with-icon ms3-map-overlay__button--desktop-view-toggle"
			viewModifierClassPrefix="ms3-map-overlay__button--desktop-view-toggle--"
		/>
	);
}

export default DesktopViewToggleButton;
