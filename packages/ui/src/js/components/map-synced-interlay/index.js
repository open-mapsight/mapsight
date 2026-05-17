import {connect} from "react-redux";

import {createStructuredSelector} from "reselect";

import {mapSizeSelector} from "@mapsight/core/lib/map/selectors";

import {MAP} from "../../config/constants/controllers";
import {viewSelector} from "../../store/selectors.ts";
import MapSyncedInterlay from "./map-synced-interlay";

export default connect(
	createStructuredSelector({
		view: viewSelector,
		size: (state) => mapSizeSelector(state[MAP]),
		//pendingUpdateSize: state => state[MAP].pendingUpdateSize || false,
	}),
)(MapSyncedInterlay);
