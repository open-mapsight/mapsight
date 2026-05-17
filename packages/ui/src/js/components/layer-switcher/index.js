import {connect} from "react-redux";

import {createStructuredSelector} from "reselect";

import {FEATURE_LIST} from "../../config/constants/controllers";
import {layerSwitcherConfigInternalSelector} from "../../store/selectors.ts";
import LayerSwitcherContainer from "./LayerSwticherContainer";

const TRUE_SET_FEATURE_SOURCE_PATH = [FEATURE_LIST, "featureSource"];

/**
 * @param {object} props properties
 * @param {Function} props.onClose callback when closed
 * @param {(state: object) => object} [props.configSelector] config selector, default = layerSwitcherConfigInternalSelector
 */
export default connect(
	createStructuredSelector({
		layerIdsSelector: (
			state,
			{configSelector = layerSwitcherConfigInternalSelector},
		) => configSelector(state).layerIdsSelector,
		grouped: (
			state,
			{configSelector = layerSwitcherConfigInternalSelector},
		) => configSelector(state).grouped,
		setFeatureSourceIdPath: function setFeatureSourceIdPath(
			state,
			{configSelector = layerSwitcherConfigInternalSelector},
		) {
			const config = configSelector(state);
			if (config.setFeatureSourceId === true) {
				return TRUE_SET_FEATURE_SOURCE_PATH;
			} else {
				return config.setFeatureSourceId;
			}
		},
	}),
	null,
	(
		stateProps,
		dispatchProps,
		{configSelector: _configSelector, ...ownProps},
	) => ({
		...ownProps,
		...stateProps,
	}),
)(LayerSwitcherContainer);
