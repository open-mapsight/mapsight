import {useCallback} from "react";

import Button from "./Button.tsx";
import Icon from "./Icon.tsx";
import VisuallyHidden from "./VisuallyHidden.tsx";
import {EDITOR_PANEL_CONFIGURATION} from "./config.ts";

function PanelConfigurationControls(props: {
	panelConfiguration: string;
	setPanelConfiguration: (panelConfiguration: string) => void;
}) {
	const {panelConfiguration, setPanelConfiguration} = props;
	const setDivided = useCallback(
		() => setPanelConfiguration(EDITOR_PANEL_CONFIGURATION.DIVIDED),
		[setPanelConfiguration],
	);
	//const setList = useCallback(() => setPanelConfiguration(EDITOR_PANEL_CONFIGURATION.LIST), [setPanelConfiguration]);
	const setMap = useCallback(
		() => setPanelConfiguration(EDITOR_PANEL_CONFIGURATION.MAP),
		[setPanelConfiguration],
	);

	//if (panelConfiguration === EDITOR_PANEL_CONFIGURATION.LIST) {
	//	return (
	//		<Button className="ms3-vector-editor-button--docked-right" onClick={setDivided}>
	//			<Icon name="icon-down" />
	//			<VisuallyHidden>Karte vergrößern</VisuallyHidden>
	//		</Button>
	//	);
	//} else

	if (panelConfiguration === EDITOR_PANEL_CONFIGURATION.MAP) {
		return (
			<Button
				className="ms3-vector-editor-button--docked-right"
				onClick={setDivided}
			>
				<Icon name="icon-up" />
				<VisuallyHidden>Liste vergrößern</VisuallyHidden>
			</Button>
		);
	} else {
		return (
			<Button
				className="ms3-vector-editor-button--docked-right"
				onClick={setMap}
			>
				<Icon name="icon-down" />
				<VisuallyHidden>Karte vergrößern</VisuallyHidden>
			</Button>

			/*

			<div className="ms3-vector-editor-panel-configuration-control-group">
				<Button onClick={setList} className="ms3-vector-editor-button--grouped">
					<Icon name="icon-up" />
					<VisuallyHidden>Liste vergrößern</VisuallyHidden>
				</Button>

				<Button onClick={setMap} className="ms3-vector-editor-button--grouped">
					<Icon name="icon-down" />
					<VisuallyHidden>Karte vergrößern</VisuallyHidden>
				</Button>
			</div>
			 */
		);
	}
}

export default PanelConfigurationControls;
