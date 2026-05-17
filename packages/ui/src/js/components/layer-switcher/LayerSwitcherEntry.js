import {connect} from "react-redux";

import {createStructuredSelector} from "reselect";

import {set as makeSetAction} from "@mapsight/core/lib/base/actions";
import {getFeatureSourceStatus} from "@mapsight/core/lib/feature-sources/selectors";
import {setLayerVisibility} from "@mapsight/core/lib/map/actions";

import getPath from "@mapsight/lib-js/object/getPath";

import {MAP} from "../../config/constants/controllers";
import SwitcherEntry from "../switcher/SwitcherEntry";

function getActiveProps({
	setFeatureSourceIdPath,
	currentlySetFeatureSourceId,
	featureSourceId,
	dispatch,
	layerId,
	visibility,
	locked,
}) {
	if (setFeatureSourceIdPath) {
		const isCurrentFeatureSource =
			currentlySetFeatureSourceId === featureSourceId;

		// this will match in intermediate state; use batching?
		//if (!visibility && isFeatureSourceCurrent) {
		//	throw new Error('illegal state');
		//}

		return {
			activeCheckbox: !!visibility,
			activeText: isCurrentFeatureSource,
			toggleActiveCheckbox: function toggleActiveCheckbox() {
				dispatch(setLayerVisibility(MAP, layerId, !visibility));
				if (isCurrentFeatureSource) {
					dispatch(makeSetAction(setFeatureSourceIdPath, undefined));
				}
			},
			toggleActiveText: function toggleActiveText() {
				dispatch(
					makeSetAction(setFeatureSourceIdPath, featureSourceId),
				);
				dispatch(setLayerVisibility(MAP, layerId, true));
			},
		};
	}

	return {
		active: !!visibility,
		toggleActive: function toggleActive() {
			if (!locked) {
				dispatch(setLayerVisibility(MAP, layerId, !visibility));
			}
		},
	};
}

const LayerSwitcherEntry = connect(
	// mapStateToProps:
	(
		state,
		{
			titleSelector,
			lockedSelector,
			layerVisibilitySelector,
			featureSourceSelector,
			featureSourceIdSelector,
			setFeatureSourceIdPath,
		},
	) =>
		createStructuredSelector({
			title: (myState) => titleSelector(myState[MAP]),
			locked: (myState) => lockedSelector(myState[MAP]),
			visibility: (myState) => layerVisibilitySelector(myState[MAP]),
			featureSource: (myState) =>
				featureSourceSelector(myState[MAP], myState),
			featureSourceId: (myState) =>
				featureSourceIdSelector(myState[MAP], myState),
			currentlySetFeatureSourceId: (myState) =>
				Array.isArray(setFeatureSourceIdPath) &&
				getPath(myState, setFeatureSourceIdPath),
		}),
	// mapDispatchToProps:
	null,
	// mergeProps:
	(
		// state props
		{
			visibility,
			title,
			locked,
			featureSource,
			featureSourceId,
			currentlySetFeatureSourceId,
		},
		// dispatch props
		{dispatch},
		// own props
		{
			// used for active props:
			layerId,
			setFeatureSourceIdPath,

			// Need to list the selectors here so they do not get passed as attribute props to the element but get filtered:
			lockedSelector: _lockedSelector,
			titleSelector: _titleSelector,
			layerVisibilitySelector: _layerVisibilitySelector,
			featureSourceSelector: _featureSourceSelector,
			featureSourceIdSelector: _featureSourceIdSelector,

			...attributes
		},
	) => ({
		title: title,
		status: getFeatureSourceStatus(featureSource),
		locked: locked,
		...getActiveProps({
			visibility: visibility,
			featureSourceId: featureSourceId,
			currentlySetFeatureSourceId: currentlySetFeatureSourceId,
			locked: locked,
			dispatch: dispatch,
			layerId: layerId,
			setFeatureSourceIdPath: setFeatureSourceIdPath,
		}),
		...attributes,
	}),
)(SwitcherEntry);

export default LayerSwitcherEntry;
