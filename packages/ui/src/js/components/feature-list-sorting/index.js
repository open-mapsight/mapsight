import {connect} from "react-redux";

import {featureSourceIdSelector} from "@mapsight/core/lib/list/selectors";
import {getGeolocation} from "@mapsight/core/lib/user-geolocation/actions";
import {geolocationStatusSelector} from "@mapsight/core/lib/user-geolocation/selectors";

import {
	FEATURE_LIST,
	USER_GEOLOCATION,
} from "../../config/constants/controllers";
import {sortList} from "../../store/actions";
import {
	effectiveListSortingSelector,
	placesSelector,
} from "../../store/selectors";
import FeatureSorter from "./feature-list-sorting";

export default connect(
	(state) => {
		const featureSourceId = featureSourceIdSelector(state[FEATURE_LIST]);

		return {
			sorting: effectiveListSortingSelector(state, featureSourceId),
			places: placesSelector(state),
			geolocationStatus: geolocationStatusSelector(
				state[USER_GEOLOCATION],
			),
		};
	},
	// dispatch map:
	{
		onChange: sortList,
		requestGeolocation: getGeolocation,
	},
)(FeatureSorter);
