import {memo} from "react";

import {translate} from "../../helpers/i18n";
import {layerSwitcherConfigExternalSelector} from "../../store/selectors";
import FilterToggleControl from "../filter-toggle-control/FilterToggleControl";
import LayerSwitcher from "../layer-switcher/index";

function FeatureListLayerSwitcherControl() {
	return (
		<FilterToggleControl
			buttonClassName="ms3-filter-button--icon-layers"
			buttonActiveClassName="ms3-filter-button--icon-layers-active"
			title={translate("ui.map-overlay.layer-switcher.openLayers")}
		>
			<LayerSwitcher
				configSelector={layerSwitcherConfigExternalSelector}
			/>
		</FilterToggleControl>
	);
}

export default memo(FeatureListLayerSwitcherControl);
