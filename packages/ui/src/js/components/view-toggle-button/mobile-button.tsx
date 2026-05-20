import ViewToggleButton from "./index.ts";

function MobileViewToggleButton() {
	return (
		<ViewToggleButton
			baseClass="ms3-map-overlay__button"
			additionalClasses="ms3-map-overlay__button--with-icon ms3-map-overlay__button--mobile-view-toggle"
			viewModifierClassPrefix="ms3-map-overlay__button--mobile-view-toggle--"
		/>
	);
}

export default MobileViewToggleButton;
