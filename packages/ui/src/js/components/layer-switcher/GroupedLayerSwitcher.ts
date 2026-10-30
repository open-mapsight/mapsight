import {connect, shallowEqual} from "react-redux";

import {createSelector} from "@reduxjs/toolkit";

import type {MapState} from "@mapsight/core/lib/map/types";
import type {State} from "@mapsight/core/types";

import {MAP} from "../../config/constants/controllers";
import type {GroupedSwitcherProps} from "../switcher/GroupedSwitcher";
import GroupedSwitcher from "../switcher/GroupedSwitcher";

type OwnProps = Omit<GroupedSwitcherProps, "groupedIds" | "ungroupedIds"> & {
	layerIdsSelector: (state: MapState) => string[];
};

function getGroupedIdsForIds(ids: string[], layersState: MapState["layers"]) {
	const groupedLayerIds: Record<string, string[]> = {};
	const withoutGroupLayerIds: string[] = [];
	ids.forEach((layerId) => {
		const group = layersState[layerId]?.metaData?.group;

		if (!group) {
			withoutGroupLayerIds.push(layerId);
			return;
		}

		groupedLayerIds[group] = groupedLayerIds[group] || [];
		groupedLayerIds[group].push(layerId);
	});

	return {
		ungroupedIds: withoutGroupLayerIds,
		groupedIds: groupedLayerIds,
	};
}

const GroupedLayerSwitcher = connect(
	createSelector(
		(state: State, {layerIdsSelector}: OwnProps) =>
			layerIdsSelector(state[MAP] as MapState),
		(state: State) => (state[MAP] as MapState).layers,
		getGroupedIdsForIds,
	),
	null,
	(
		stateProps,
		dispatchProps,
		{layerIdsSelector: _layerIdsSelector, ...ownProps}: OwnProps,
	) => ({
		...ownProps,
		...stateProps,
	}),
	{areStatesEqual: shallowEqual},
)(GroupedSwitcher);

export default GroupedLayerSwitcher;
