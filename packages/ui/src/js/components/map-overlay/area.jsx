import ErrorBoundary from "../error-boundary";

/**
 * @param {object} props props
 * @param {"top-left" | "top-right" | "bottom-right" | "bottom-left"} props.position position
 * @param {React.ReactChildren} props.children children
 * @returns {React.ReactElement} element
 */
function MapOverlayArea({position, children}) {
	return (
		<div
			className={`ms3-map-overlay__area ms3-map-overlay__area--${position}`}
		>
			<ErrorBoundary variant="overlay">{children}</ErrorBoundary>
		</div>
	);
}

export default MapOverlayArea;
