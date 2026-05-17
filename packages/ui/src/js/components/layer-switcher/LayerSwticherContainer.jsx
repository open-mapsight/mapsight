import {
	layerIdsIntegratedSwitcherSelector,
	makeFeatureSourceFromLayerIdSelector,
	makeFeatureSourceIdFromLayerIdSelector,
	makeLayerLockedInLayerSwitcherSelector,
	makeLayerTitleSelector,
	makeLayerVisibleSelector,
} from "@mapsight/core/lib/map/selectors";
import {memo, useCallback} from "react";

import {translate} from "../../helpers/i18n";

import GroupedLayerSwitcher from "./GroupedLayerSwitcher";
import LayerSwitcher from "./LayerSwitcher";
import LayerSwitcherEntry from "./LayerSwitcherEntry";

// TODO das berechnen der LayerListen (abhängig von grouped und layerIdSelector) in einen Selector packen,
//  damit diese Berechnung nur bei Änderungen am store berechnet neu wird
// TODO für das visible eine eigenes connect, damit der Tree nicht dauernd neu berechnet wird

function LayerSwitcherContainer(props) {
	const {
		as: T = "div",
		baseClassName = "ms3-layer-switcher-container", // TODO: Use generic class name
		onClose,
		layerIdsSelector = layerIdsIntegratedSwitcherSelector,
		setFeatureSourceIdPath,
		grouped = false,
		...attributes
	} = props;

	const renderLayerEntry = useCallback(
		(id) => (
			// TODO: memo comp instance & selectors
			<LayerSwitcherEntry
				key={id}
				layerId={id}
				titleSelector={makeLayerTitleSelector(id)}
				lockedSelector={makeLayerLockedInLayerSwitcherSelector(id)}
				layerVisibilitySelector={makeLayerVisibleSelector(id)}
				featureSourceSelector={makeFeatureSourceFromLayerIdSelector(id)}
				featureSourceIdSelector={makeFeatureSourceIdFromLayerIdSelector(
					id,
				)}
				setFeatureSourceIdPath={setFeatureSourceIdPath}
			/>
		),
		[setFeatureSourceIdPath],
	);

	const Switcher = grouped ? GroupedLayerSwitcher : LayerSwitcher;

	return (
		<T
			className={`${baseClassName} ${baseClassName}--${
				grouped ? "grouped" : "ungrouped"
			}`}
		>
			<Switcher
				layerIdsSelector={layerIdsSelector}
				renderEntry={renderLayerEntry}
				{...attributes}
			/>

			{onClose && (
				<button
					className="ms3-layer-switcher__close-button [ ms3-dialog-close-button ]"
					type="button"
					onClick={onClose}
				>
					<span className="ms3-visuallyhidden">
						{translate("ui.map-overlay.layer-switcher.closeLayers")}
					</span>
				</button>
			)}
		</T>
	);
}

export default memo(LayerSwitcherContainer);
