import type {PropsWithChildren} from "react";
import {useContext, useRef} from "react";

import {ComponentsContext} from "../../helpers/components";
import useMapsightPanel from "../../hooks/useMapsightPanel";
import type {MainPanelPosition} from "../../types";
import {useMainPanelContext} from "./context";

export type MainPanelContainerProps = PropsWithChildren<{
	panelPosition?: MainPanelPosition;
	collapsed?: boolean;
}>;

/**
 * Always keeps the panel chrome (width / flex orientation). Hosts may replace
 * the *inner* content via `components.MainPanelContainer`.
 *
 * @deprecated Full host replacement of panel chrome is not supported; inner
 *   slot replacement remains for migration. Slot shape may change in the next
 *   major of `@mapsight/ui`.
 */
function MainPanelContainer({children}: PropsWithChildren) {
	const {panelPosition, collapsed} = useMainPanelContext();
	const comps = useContext(ComponentsContext);
	const HostMainPanelContainer = comps.MainPanelContainer;

	const containerRef = useRef<HTMLDivElement>(null);
	useMapsightPanel(containerRef, panelPosition, collapsed);

	const orientationClassName =
		panelPosition === "below"
			? "ms3-panel-container--horizontal"
			: "ms3-panel-container--vertical";
	const containerClasses = [
		"ms3-panel-container",
		`ms3-panel-container--docked-${panelPosition}`,
		orientationClassName,
		collapsed ? "ms3-panel-container--empty" : "",
	]
		.filter(Boolean)
		.join(" ");

	const content = HostMainPanelContainer ? (
		<HostMainPanelContainer
			panelPosition={panelPosition}
			collapsed={collapsed}
		>
			{children}
		</HostMainPanelContainer>
	) : (
		children
	);

	return (
		<div className={containerClasses} ref={containerRef}>
			{content}
		</div>
	);
}

export default MainPanelContainer;

declare module "../../helpers/components" {
	interface ComponentProps {
		MainPanelContainer: MainPanelContainerProps;
	}
}
