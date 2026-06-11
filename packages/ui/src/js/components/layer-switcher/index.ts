import {connect} from "react-redux";

import type {Selector} from "@mapsight/core/types";

import {FEATURE_LIST} from "../../config/constants/controllers";
import type {RootStateSlice} from "../../store/selectors";
import {layerSwitcherConfigInternalSelector} from "../../store/selectors";
import type {LayerSwitcherConfigState} from "../../types";
import LayerSwitcherContainer from "./LayerSwitcherContainer";

const TRUE_SET_FEATURE_SOURCE_PATH = [FEATURE_LIST, "featureSource"];

type Props = {
	configSelector?: Selector<LayerSwitcherConfigState | undefined>;
};

export default connect(
	(
		state: RootStateSlice,
		{configSelector = layerSwitcherConfigInternalSelector}: Props,
	) => {
		const setFeatureSourceId = configSelector(state)?.setFeatureSourceId;

		return {
			layerIdsSelector: configSelector(state)?.layerIdsSelector,
			grouped: configSelector(state)?.grouped,
			setFeatureSourceIdPath:
				setFeatureSourceId === true
					? TRUE_SET_FEATURE_SOURCE_PATH
					: setFeatureSourceId,
		};
	},
	null,
	(
		stateProps,
		_dispatchProps,
		{configSelector: _configSelector, ...ownProps},
	) => ({
		...ownProps,
		...stateProps,
	}),
)(LayerSwitcherContainer);
