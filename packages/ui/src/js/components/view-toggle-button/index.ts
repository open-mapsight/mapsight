import {connect} from "react-redux";

import {deselectAll} from "@mapsight/core/lib/feature-selections/actions";

import type {View} from "../../config/constants/app.ts";
import {FEATURE_SELECTIONS} from "../../config/constants/controllers";
import {FEATURE_SELECTION_SELECT} from "../../config/feature/selections";
import {setView} from "../../store/actions.ts";
import type {RootStateSlice} from "../../store/selectors.ts";
import {
	isMapOutOfViewportSelector,
	isViewMobile,
	viewSelector,
	viewToggleOptionsSelector,
} from "../../store/selectors.ts";
import ViewToggleButton from "./view-toggle-button";

export default connect(
	(state: RootStateSlice) => ({
		view: viewSelector(state),
		isMapOutOfViewport: isMapOutOfViewportSelector(state),
		options: viewToggleOptionsSelector(state),
	}),
	null,
	({options, ...stateProps}, {dispatch}, ownProps) => ({
		...stateProps,
		dispatch: dispatch,
		changeView: (currentView: View, nextView: View) => {
			dispatch(setView(nextView));

			if (
				options?.deselectFeaturesOnToggle &&
				isViewMobile(currentView)
			) {
				dispatch(
					deselectAll(FEATURE_SELECTIONS, FEATURE_SELECTION_SELECT),
				);
			}
		},
		...ownProps,
	}),
)(ViewToggleButton);
