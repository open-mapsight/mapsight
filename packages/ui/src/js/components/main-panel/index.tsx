import type {ReactNode} from "react";
import {useRef} from "react";

import FeatureList from "../feature-list";
import FeatureSelectionInfo from "../feature-selection-info";
import {useMainPanelContext} from "./context";

function MainPanel() {
	const {contentType, panelPosition, collapsed, feature} =
		useMainPanelContext();

	// we keep using the old content stored in contentRef.current if we do not have any new content
	// to allow for a smooth transition when collapsing the container
	const contentRef = useRef<ReactNode>(null);
	const isShowingSelectionInfoRef = useRef(false);

	if (contentType) {
		isShowingSelectionInfoRef.current = contentType === "selectionInfo";
		contentRef.current = (
			<>
				<FeatureList enableKeyboardControl={!collapsed} />

				{isShowingSelectionInfoRef.current && (
					<FeatureSelectionInfo
						feature={feature}
						enableKeyboardControl={!collapsed}
					/>
				)}
			</>
		);
	}

	return (
		<div
			className={`ms3-panel ms3-panel--docked-${panelPosition} ${
				collapsed ? "ms3-panel--empty" : ""
			} ${
				isShowingSelectionInfoRef.current ? "ms3-panel--hide-list" : ""
			}`}
		>
			<div className="ms3-panel__inner">{contentRef.current}</div>
		</div>
	);
}

export default MainPanel;
