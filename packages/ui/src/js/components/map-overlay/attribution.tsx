import type {PropsWithChildren} from "react";
import {useSelector} from "react-redux";

import {visibleLayerAttributionPartsSelector} from "@mapsight/core/lib/map/selectors";
import type {MapState} from "@mapsight/core/lib/map/types";
import type {State} from "@mapsight/core/types";

import {MAP} from "../../config/constants/controllers";
import AttributionEntries from "./attribution-entries";

function selectVisibleLayerAttributionParts(state: State) {
	return visibleLayerAttributionPartsSelector(state[MAP] as MapState);
}

function Attribution({children}: PropsWithChildren) {
	const attributions = useSelector(selectVisibleLayerAttributionParts);

	return (
		<AttributionEntries attributions={attributions}>
			{children}
		</AttributionEntries>
	);
}

export default Attribution;
