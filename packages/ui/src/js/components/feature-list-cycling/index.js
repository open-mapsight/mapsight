import {connect} from "react-redux";

import {batchActions} from "redux-batched-actions";
import {createSelector} from "reselect";

import {
	deselectAll,
	selectExclusively,
} from "@mapsight/core/lib/feature-selections/actions";
import {
	createFeatureSelectionSelector,
	getFilteredFeatures,
} from "@mapsight/core/lib/feature-selections/selectors";

import {FEATURE_SELECTIONS} from "../../config/constants/controllers";
import {
	FEATURE_SELECTION_HIGHLIGHT,
	FEATURE_SELECTION_SELECT,
} from "../../config/feature/selections";
import FeatureListCycling from "./feature-list-cycling";

export default connect(
	// stateProps selector
	createSelector(
		[
			createFeatureSelectionSelector(
				FEATURE_SELECTIONS,
				FEATURE_SELECTION_SELECT,
			),
			createFeatureSelectionSelector(
				FEATURE_SELECTIONS,
				FEATURE_SELECTION_HIGHLIGHT,
			),
		],

		(selectSelection, highlightSelection) => {
			const selectSelectionFeatures =
				getFilteredFeatures(selectSelection);
			const highlightSelectionFeatures =
				getFilteredFeatures(highlightSelection);

			return {
				selectedFeatureId:
					selectSelectionFeatures && selectSelectionFeatures[0],
				highlightedFeatureId:
					highlightSelectionFeatures && highlightSelectionFeatures[0],
			};
		},
	),

	// dispatchProps
	(dispatch) => ({
		onFeatureSelection: (id, b, c) => {
			const actions = [
				deselectAll(FEATURE_SELECTIONS, FEATURE_SELECTION_HIGHLIGHT),
				selectExclusively(
					FEATURE_SELECTIONS,
					FEATURE_SELECTION_SELECT,
					id,
					b,
					c,
				),
			];

			dispatch(batchActions(actions));
		},
		onFeatureUnSelection: () =>
			dispatch(deselectAll(FEATURE_SELECTIONS, FEATURE_SELECTION_SELECT)),
		onFeatureHighlight: (id) =>
			dispatch(
				selectExclusively(
					FEATURE_SELECTIONS,
					FEATURE_SELECTION_HIGHLIGHT,
					id,
				),
			),
		onFeatureUnHighlight: () =>
			dispatch(
				deselectAll(FEATURE_SELECTIONS, FEATURE_SELECTION_HIGHLIGHT),
			),
	}),
)(FeatureListCycling);
