import {connect} from "react-redux";

import {createStructuredSelector} from "reselect";

import {deselectAll} from "@mapsight/core/lib/feature-selections/actions";

import {FEATURE_SELECTIONS} from "../../config/constants/controllers";
import {FEATURE_SELECTION_SELECT} from "../../config/feature/selections";
import {setView} from "../../store/actions.ts";
import {
	isMapOutOfViewportSelector,
	isViewMobile,
	viewSelector,
	viewToggleOptionsSelector,
} from "../../store/selectors.ts";
import ViewToggleButton from "./view-toggle-button";

export default connect(
	createStructuredSelector({
		view: viewSelector,
		isMapOutOfViewport: isMapOutOfViewportSelector,
		options: viewToggleOptionsSelector,
	}),
	null,
	({options, ...stateProps}, {dispatch}, ownProps) => ({
		...stateProps,
		dispatch: dispatch,
		changeView: (currentView, nextView) => {
			dispatch(setView(nextView));

			if (options.deselectFeaturesOnToggle && isViewMobile(currentView)) {
				dispatch(
					deselectAll(FEATURE_SELECTIONS, FEATURE_SELECTION_SELECT),
				);
			}
		},
		...ownProps,
	}),
)(ViewToggleButton);
