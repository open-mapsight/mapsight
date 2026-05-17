import {useRef} from "react";

import useMapsightPanel from "../../hooks/useMapsightPanel";
import {useMainPanelContext} from "./context";

function MainPanelContainer({children}) {
	const {panelPosition, collapsed} = useMainPanelContext();

	const containerRef = useRef<HTMLDivElement>(null);
	useMapsightPanel(containerRef, panelPosition, collapsed);

	const containerClasses = `ms3-panel-container ms3-panel-container--docked-${panelPosition} ${
		collapsed ? "ms3-panel-container--empty" : ""
	}`;

	return (
		<div className={containerClasses} ref={containerRef}>
			{children}
		</div>
	);
}

export default MainPanelContainer;
