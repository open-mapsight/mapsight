import {useState} from "react";

import FeatureList from "../feature-list";
import FeatureSelectionInfo from "../feature-selection-info";
import {useMainPanelContext} from "./context";

function MainPanel() {
	const {contentType, panelPosition, collapsed, feature, showList} =
		useMainPanelContext();

	// Retain data for the collapse animation, but always render live keyboard props.
	const [retained, setRetained] = useState({contentType, feature});
	if (
		contentType &&
		(contentType !== retained.contentType || feature !== retained.feature)
	) {
		setRetained({contentType, feature});
	}
	const isShowingSelectionInfo = retained.contentType === "selectionInfo";

	return (
		<div
			className={`ms3-panel ms3-panel--docked-${panelPosition} ${
				collapsed ? "ms3-panel--empty" : ""
			} ${isShowingSelectionInfo ? "ms3-panel--hide-list" : ""}`}
		>
			<div
				className="ms3-panel__inner"
				inert={collapsed}
				aria-hidden={collapsed || undefined}
			>
				{showList && retained.contentType && (
					<FeatureList enableKeyboardControl={!collapsed} />
				)}
				{isShowingSelectionInfo && (
					<FeatureSelectionInfo
						feature={retained.feature}
						isOpen={!collapsed && contentType === "selectionInfo"}
						enableKeyboardControl={
							!collapsed && contentType === "selectionInfo"
						}
					/>
				)}
			</div>
		</div>
	);
}

export default MainPanel;
