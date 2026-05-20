import ViewToggleButton from "./index.ts";

function ViewportViewToggleButton() {
	return (
		<ViewToggleButton
			baseClass="ms3-viewport-button"
			additionalClasses="ms3-viewport-button--bottom-right ms3-viewport-button--mobile-view-toggle"
			viewModifierClassPrefix="ms3-viewport-button--mobile-view-toggle--"
		/>
	);
}

export default ViewportViewToggleButton;
