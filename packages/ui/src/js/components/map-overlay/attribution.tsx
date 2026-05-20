import type {PropsWithChildren} from "react";
import {useSelector} from "react-redux";

import {visibleLayerAttributionsSelector} from "@mapsight/core/lib/map/selectors";
import type {MapState} from "@mapsight/core/lib/map/types";
import type {State} from "@mapsight/core/types";

import {MAP} from "../../config/constants/controllers";
import AttributionEntries from "./attribution-entries";

function selectVisibleLayerAttributions(state: State) {
	return visibleLayerAttributionsSelector(state[MAP] as MapState);
}

function Attribution({children}: PropsWithChildren) {
	const attributions = useSelector(selectVisibleLayerAttributions);

	return (
		<AttributionEntries attributions={attributions ?? undefined}>
			{children}
		</AttributionEntries>
	);
}

export default Attribution;
