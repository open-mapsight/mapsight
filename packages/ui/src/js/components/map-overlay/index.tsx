import type {PropsWithChildren} from "react";

function MapOverlay({children}: PropsWithChildren) {
	return <div className="ms3-map-overlay">{children}</div>;
}

export default MapOverlay;
