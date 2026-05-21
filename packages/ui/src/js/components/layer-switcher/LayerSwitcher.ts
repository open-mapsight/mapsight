import {connect} from "react-redux";

import type {MapState} from "@mapsight/core/lib/map/types";
import type {State} from "@mapsight/core/types";

import {MAP} from "../../config/constants/controllers";
import Switcher from "../switcher/Switcher";

const selector = (
	state: State,
	{layerIdsSelector}: {layerIdsSelector: (state: MapState) => string[]},
) =>
	({
		ids: layerIdsSelector(state[MAP] as MapState),
	}) as const;

export default connect(
	selector,
	null,
	(
		stateProps,
		_,
		{
			// Need to list the selectors here so they do not get passed as attribute props to the element but get filtered:
			layerIdsSelector: _layerIdsSelector,

			...attributes
		},
	) => ({
		// We do not want to pass dispatch to the switcher, so we explicitly do not map it!
		...stateProps,
		...attributes,
	}),
)(Switcher);
