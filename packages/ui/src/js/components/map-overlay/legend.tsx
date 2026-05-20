import {useSelector} from "react-redux";

import {createSelector} from "@reduxjs/toolkit";

import {
	reduceLayersToLegends,
	visibleLayersWithLegendsSelector,
} from "@mapsight/core/lib/map/selectors";

import {MAP} from "../../config/constants/controllers";
import AttributionEntries from "./attribution-entries";

// die anzuzeigenden Legenden hier selbst berechnen zusammen mit den css-Namen
const legendsSelector = createSelector(
	(state) => visibleLayersWithLegendsSelector(state[MAP]),
	reduceLayersToLegends,
);

export default function Legend() {
	const legends = useSelector(legendsSelector);
	return <AttributionEntries attributions={legends} />;
}
