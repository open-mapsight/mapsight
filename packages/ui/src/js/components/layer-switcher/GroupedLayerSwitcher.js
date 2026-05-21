import {connect, shallowEqual} from "react-redux";

import {createSelector} from "@reduxjs/toolkit";

import {MAP} from "../../config/constants/controllers";
import GroupedSwitcher from "../switcher/GroupedSwitcher";

function getGroupedIdsForIds(ids, layersState) {
	const groupedLayerIds = {};
	const withoutGroupLayerIds = [];
	ids.forEach((layerId) => {
		const group = layersState[layerId].metaData.group;

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
		(state, {layerIdsSelector}) => layerIdsSelector(state[MAP]),
		(state) => state[MAP].layers,
		getGroupedIdsForIds,
	),
	null,
	(
		stateProps,
		dispatchProps,
		{layerIdsSelector: _layerIdsSelector, ...ownProps},
	) => ({
		...ownProps,
		...stateProps,
	}),
	{areStatesEqual: shallowEqual},
)(GroupedSwitcher);

export default GroupedLayerSwitcher;
