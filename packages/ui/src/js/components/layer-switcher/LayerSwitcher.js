import {connect} from "react-redux";

import {MAP} from "../../config/constants/controllers";
import Switcher from "../switcher/Switcher";

const selector = (state, {layerIdsSelector}) => ({
	ids: layerIdsSelector(state[MAP]),
});

export default connect(
	selector,
	null,
	(
		stateProps,
		dispatchProps,
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
