import {connect} from "react-redux";

import {mapSizeSelector} from "@mapsight/core/lib/map/selectors";
import type {MapState} from "@mapsight/core/lib/map/types";

import {MAP} from "../../config/constants/controllers";
import type {RootStateSlice} from "../../store/selectors.ts";
import {viewSelector} from "../../store/selectors.ts";
import MapSyncedInterlay from "./map-synced-interlay";

export default connect((state: RootStateSlice) => ({
	view: viewSelector(state),
	size: mapSizeSelector(state[MAP] as MapState),
	//pendingUpdateSize: state[MAP].pendingUpdateSize || false,
}))(MapSyncedInterlay);
