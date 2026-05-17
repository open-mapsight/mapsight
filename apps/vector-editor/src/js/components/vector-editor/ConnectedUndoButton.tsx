import {connect} from "react-redux";

import {createStructuredSelector} from "reselect";

import {undo} from "@mapsight/core/lib/feature-sources/actions";
import {canUndo} from "@mapsight/core/lib/feature-sources/selectors";

import UndoButton from "./UndoButton.tsx";

export default connect(
	createStructuredSelector({
		enabled: (state, {featureSource}) =>
			canUndo(state.featureSources[featureSource]),
	}),
	(dispatch, {featureSource}) => ({
		onClick: () => dispatch(undo("featureSources", featureSource)),
	}),
)(UndoButton);
