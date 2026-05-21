import {connect} from "react-redux";

import {redo} from "@mapsight/core/lib/feature-sources/actions";
import {canRedo} from "@mapsight/core/lib/feature-sources/selectors";
import type {FeatureSourcesState} from "@mapsight/core/lib/feature-sources/types";
import type {State} from "@mapsight/core/types";

import RedoButton from "./RedoButton.tsx";

type Props = {
	featureSource: string;
};

export default connect(
	(state: State, {featureSource}: Props) => ({
		enabled: canRedo(
			(state.featureSources as FeatureSourcesState)[featureSource]!,
		),
	}),
	(dispatch, {featureSource}) => ({
		onClick: () => dispatch(redo("featureSources", featureSource)),
	}),
)(RedoButton);
