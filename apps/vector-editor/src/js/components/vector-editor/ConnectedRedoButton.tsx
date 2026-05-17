import {connect} from "react-redux";

import {createStructuredSelector} from "reselect";

import {redo} from "@mapsight/core/lib/feature-sources/actions";
import {canRedo} from "@mapsight/core/lib/feature-sources/selectors";

import RedoButton from "./RedoButton.tsx";

export default connect(
	createStructuredSelector({
		enabled: (state, {featureSource}) =>
			canRedo(state.featureSources[featureSource]),
	}),
	(dispatch, {featureSource}) => ({
		onClick: () => dispatch(redo("featureSources", featureSource)),
	}),
)(RedoButton);
