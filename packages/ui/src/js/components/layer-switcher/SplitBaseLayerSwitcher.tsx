import type {ReactNode} from "react";
import {connect, shallowEqual} from "react-redux";

import {createSelector} from "@reduxjs/toolkit";

import type {MapState} from "@mapsight/core/lib/map/types";
import type {State} from "@mapsight/core/types";

import {MAP} from "../../config/constants/controllers";
import {translate} from "../../helpers/i18n";

type LayerGroup = {
	group: string;
	layerIds: string[];
};

type SplitBaseLayerSwitcherStateProps = {
	baseLayerIds: string[];
	groups: LayerGroup[];
	ungroupedLayerIds: string[];
};

type SplitBaseLayerSwitcherOwnProps = {
	layerIdsSelector: (state: MapState) => string[];
	renderBaseLayerEntry: (id: string, group?: string | null) => ReactNode;
	renderEntry: (id: string, group?: string | null) => ReactNode;
};

function getSplitLayerIds(ids: string[], layers: MapState["layers"]) {
	const baseLayerIds: string[] = [];
	const groupsByName = new Map<string, string[]>();
	const ungroupedLayerIds: string[] = [];

	for (const layerId of ids) {
		const layer = layers[layerId];
		if (layer?.metaData?.isBaseLayer) {
			baseLayerIds.push(layerId);
			continue;
		}

		const group = layer?.metaData?.group;
		if (!group) {
			ungroupedLayerIds.push(layerId);
			continue;
		}

		const groupLayerIds = groupsByName.get(group) ?? [];
		groupLayerIds.push(layerId);
		groupsByName.set(group, groupLayerIds);
	}

	return {
		baseLayerIds,
		groups: Array.from(groupsByName, ([group, layerIds]) => ({
			group,
			layerIds,
		})),
		ungroupedLayerIds,
	};
}

function SplitBaseLayerSwitcher({
	baseLayerIds,
	groups,
	ungroupedLayerIds,
	renderBaseLayerEntry,
	renderEntry,
}: SplitBaseLayerSwitcherStateProps & SplitBaseLayerSwitcherOwnProps) {
	const hasOverlayLayers = groups.length > 0 || ungroupedLayerIds.length > 0;

	return (
		<div className="ms3-layer-switcher ms3-layer-switcher--split-base-layers">
			{baseLayerIds.length > 0 ? (
				<section className="ms3-layer-switcher__section ms3-layer-switcher__section--base-layers">
					<h3 className="ms3-layer-switcher__section-title">
						{translate("ui.layer-switcher.baseLayers")}
					</h3>
					<ul className="ms3-layer-switcher__entries ms3-layer-switcher__entries--base-layers">
						{baseLayerIds.map((layerId) =>
							renderBaseLayerEntry(layerId, null),
						)}
					</ul>
				</section>
			) : null}

			{hasOverlayLayers ? (
				<section className="ms3-layer-switcher__section ms3-layer-switcher__section--overlay-layers">
					<h3 className="ms3-layer-switcher__section-title">
						{translate("ui.layer-switcher.overlayLayers")}
					</h3>
					<div className="ms3-grouped-switcher ms3-grouped-switcher--wrapped">
						{groups.map(({group, layerIds}) => (
							<section
								key={group}
								className="ms3-grouped-switcher__group"
								data-ms3-switcher-group={group}
							>
								<h4
									className="ms3-layer-switcher__header"
									data-ms3-switcher-header-group={group}
								>
									<span className="ms3-switcher-header__label">
										{group}
									</span>
								</h4>
								<ul
									className="ms3-layer-switcher__entries"
									data-ms3-switcher-entries-group={group}
								>
									{layerIds.map((layerId) =>
										renderEntry(layerId, group),
									)}
								</ul>
							</section>
						))}

						{ungroupedLayerIds.length > 0 ? (
							<section className="ms3-grouped-switcher__group">
								<ul className="ms3-layer-switcher__entries">
									{ungroupedLayerIds.map((layerId) =>
										renderEntry(layerId, null),
									)}
								</ul>
							</section>
						) : null}
					</div>
				</section>
			) : null}
		</div>
	);
}

export default connect(
	createSelector(
		(state: State, {layerIdsSelector}: SplitBaseLayerSwitcherOwnProps) => {
			const mapState = state[MAP] as MapState;
			return {
				layerIds: layerIdsSelector(mapState),
				layers: mapState.layers,
			};
		},
		({layerIds, layers}) => getSplitLayerIds(layerIds, layers),
	),
	null,
	(
		stateProps,
		_dispatchProps,
		{layerIdsSelector: _layerIdsSelector, ...ownProps},
	) => ({
		...ownProps,
		...stateProps,
	}),
	{areStatesEqual: shallowEqual},
)(SplitBaseLayerSwitcher);
