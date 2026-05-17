import {connect} from "react-redux";

import {createStructuredSelector} from "reselect";

import {getGeolocation} from "@mapsight/core/lib/user-geolocation/actions";
import {geolocationStatusSelector} from "@mapsight/core/lib/user-geolocation/selectors";

import {USER_GEOLOCATION} from "../../config/constants/controllers";
import {sortList} from "../../store/actions.ts";
import {listSortingSelector, placesSelector} from "../../store/selectors.ts";
import FeatureSorter from "./feature-list-sorting";

export default connect(
	createStructuredSelector({
		sorting: listSortingSelector,
		places: placesSelector,
		geolocationStatus: (state) =>
			geolocationStatusSelector(state[USER_GEOLOCATION]),
	}),
	// dispatch map:
	{
		onChange: sortList,
		requestGeolocation: getGeolocation,
	},
)(FeatureSorter);
