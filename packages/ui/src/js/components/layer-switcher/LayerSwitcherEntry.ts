import type {ReactNode} from "react";
import {connect} from "react-redux";

import type {Dispatch} from "@reduxjs/toolkit";

import type {ActionPath} from "@mapsight/core/lib/base/actions";
import {set as makeSetAction} from "@mapsight/core/lib/base/actions";
import {getFeatureSourceStatus} from "@mapsight/core/lib/feature-sources/selectors";
import type {FeatureSourceState} from "@mapsight/core/lib/feature-sources/types";
import {setLayerVisibility} from "@mapsight/core/lib/map/actions";
import type {MapState} from "@mapsight/core/lib/map/types";
import type {State} from "@mapsight/core/types";

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
	exclusive,
}: {
	locked: boolean;
	visibility: boolean;
	exclusive?: boolean;
	featureSourceId: string | undefined;
	currentlySetFeatureSourceId: string | undefined;
	dispatch: Dispatch;
	layerId: string;
	setFeatureSourceIdPath?: ActionPath | null;
}) {
	if (setFeatureSourceIdPath) {
		const isCurrentFeatureSource =
			currentlySetFeatureSourceId === featureSourceId;

		// this will match in intermediate state; use batching?
		//if (!visibility && isFeatureSourceCurrent) {
		//	throw new Error('illegal state');
		//}

		return {
			activeCheckbox: visibility,
			activeText: isCurrentFeatureSource,
			toggleActiveCheckbox: function toggleActiveCheckbox() {
				dispatch(setLayerVisibility(MAP, layerId, !visibility));
				if (isCurrentFeatureSource) {
					dispatch(makeSetAction(setFeatureSourceIdPath, undefined));
				}
			},
			toggleActiveText: function toggleActiveText() {
				if (featureSourceId) {
					dispatch(
						makeSetAction(setFeatureSourceIdPath, featureSourceId),
					);
				}
				dispatch(setLayerVisibility(MAP, layerId, true));
			},
		};
	}

	return {
		active: visibility,
		exclusive,
		toggleActive: function toggleActive() {
			if (locked || (exclusive && visibility)) {
				return;
			}
			dispatch(
				setLayerVisibility(
					MAP,
					layerId,
					exclusive ? true : !visibility,
				),
			);
		},
	};
}

export type LayerSwitcherEntryProps = {
	layerId: string;
	titleSelector: (state: MapState) => string;
	lockedSelector: (state: MapState) => boolean;
	layerVisibilitySelector: (state: MapState) => boolean;
	featureSourceSelector: (
		mapState: MapState,
		state: State,
	) => FeatureSourceState | null;
	featureSourceIdSelector: (state: MapState) => string | undefined;
	setFeatureSourceIdPath?: ActionPath | null;
	/** When true, this entry cannot be toggled off (exactly one must stay active). */
	exclusive?: boolean;
	/** Host content after the title (e.g. presentational badges). */
	end?: ReactNode;
};

const mapStateToProps = (
	state: State,
	{
		layerId,
		titleSelector,
		lockedSelector,
		layerVisibilitySelector,
		featureSourceSelector,
		featureSourceIdSelector,
		setFeatureSourceIdPath,
	}: LayerSwitcherEntryProps,
) => {
	const mapState = state[MAP] as MapState;

	return {
		title: titleSelector(mapState),
		locked: lockedSelector(mapState),
		visibility: layerVisibilitySelector(mapState),
		featureSource: featureSourceSelector(mapState, state),
		featureSourceId: featureSourceIdSelector(mapState),
		previewUrl:
			mapState.layers[layerId]?.metaData?.layerSwitcherPreviewUrl ?? null,
		currentlySetFeatureSourceId: Array.isArray(setFeatureSourceIdPath)
			? (getPath(state, setFeatureSourceIdPath) as string | undefined)
			: undefined,
	};
};

const LayerSwitcherEntry = connect(
	mapStateToProps,
	null,
	// mergeProps:
	(
		stateProps,
		{dispatch},
		{
			// used for active props:
			layerId,
			setFeatureSourceIdPath,
			exclusive,

			// Need to list the selectors here so they do not get passed as attribute props to the element but get filtered:
			lockedSelector: _1,
			titleSelector: _2,
			layerVisibilitySelector: _3,
			featureSourceSelector: _4,
			featureSourceIdSelector: _5,

			...attributes
		},
	) => ({
		title: stateProps.title,
		status: stateProps.featureSource
			? getFeatureSourceStatus(stateProps.featureSource)
			: undefined,
		locked: stateProps.locked,
		previewUrl: stateProps.previewUrl,
		...getActiveProps({
			visibility: stateProps.visibility,
			featureSourceId: stateProps.featureSourceId ?? "",
			currentlySetFeatureSourceId: stateProps.currentlySetFeatureSourceId,
			locked: stateProps.locked,
			exclusive,
			dispatch,
			layerId,
			setFeatureSourceIdPath,
		}),
		...attributes,
	}),
)(SwitcherEntry);

export default LayerSwitcherEntry;
