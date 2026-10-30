import {connect} from "react-redux";

import {featureSourceIdSelector} from "@mapsight/core/lib/list/selectors";
import type {ListState} from "@mapsight/core/lib/list/types";
import {getGeolocation} from "@mapsight/core/lib/user-geolocation/actions";
import type {UserGeolocationState} from "@mapsight/core/lib/user-geolocation/selectors";
import {geolocationStatusSelector} from "@mapsight/core/lib/user-geolocation/selectors";
import type {State} from "@mapsight/core/types";

import {
	FEATURE_LIST,
	USER_GEOLOCATION,
} from "../../config/constants/controllers";
import {sortList} from "../../store/actions";
import type {RootStateSlice} from "../../store/selectors";
import {
	effectiveListSortingSelector,
	placesSelector,
} from "../../store/selectors";
import FeatureSorter from "./feature-list-sorting";

export default connect(
	(state: State & RootStateSlice) => {
		const featureSourceId = featureSourceIdSelector(
			state[FEATURE_LIST] as ListState,
		);

		return {
			sorting: effectiveListSortingSelector(state, featureSourceId),
			places: placesSelector(state),
			geolocationStatus: geolocationStatusSelector(
				state[USER_GEOLOCATION] as UserGeolocationState,
			),
		};
	},
	// dispatch map:
	{
		onChange: sortList,
		requestGeolocation: getGeolocation,
	},
)(FeatureSorter);
