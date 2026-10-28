import type {PropsWithChildren} from "react";

import ErrorBoundary from "../error-boundary";

function MapOverlayArea({
	position,
	children,
}: PropsWithChildren<{
	position: "top-left" | "top-right" | "bottom-right" | "bottom-left";
}>) {
	return (
		<div
			className={`ms3-map-overlay__area ms3-map-overlay__area--${position}`}
		>
			<ErrorBoundary variant="overlay">{children}</ErrorBoundary>
		</div>
	);
}

export default MapOverlayArea;
