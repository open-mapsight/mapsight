import {connect} from "react-redux";

import {undo} from "@mapsight/core/lib/feature-sources/actions";
import {canUndo} from "@mapsight/core/lib/feature-sources/selectors";
import type {FeatureSourcesState} from "@mapsight/core/lib/feature-sources/types";
import type {State} from "@mapsight/core/types";

import UndoButton from "./UndoButton.tsx";

type Props = {
	featureSource: string;
};

export default connect(
	(state: State, {featureSource}: Props) => ({
		enabled: canUndo(
			(state.featureSources as FeatureSourcesState)[featureSource]!,
		),
	}),
	(dispatch, {featureSource}) => ({
		onClick: () => dispatch(undo("featureSources", featureSource)),
	}),
)(UndoButton);
