import isEqual from "lodash/isEqual";

import {mergeAll} from "@mapsight/core/lib/base/actions";
import type {EnhancedStore, State} from "@mapsight/core/types";

import {observeState} from "@mapsight/lib-redux/observe-state";

import {FEATURE_SOURCES, MAP} from "../../config/constants/controllers";
import type {PluginInstance} from "../../types";

export type VisibleLayerMembers = string[] | Record<string, string>;

type VisibleLayerMember = {
	featureSourceName: string;
	layerName: string;
};

type MapLayersState = {
	layers?: Record<string, {options?: {visible?: boolean}}>;
};

export type CombinedVisibleLayersBinding = {
	combinedFeatureSourceId: string;
	members?: VisibleLayerMembers;
	getMembers?: () => VisibleLayerMembers;
	mapControllerName?: string;
	featureSourcesControllerName?: string;
};

/**
 * Keeps a combined feature source in sync with the visible subset of its
 * configured member layers.
 */
export default function createCombinedVisibleLayersPlugin(
	options: CombinedVisibleLayersBinding,
): PluginInstance {
	return {
		afterCreate(context) {
			if (!context.store) {
				return;
			}

			const store: EnhancedStore = context.store;
			const mapControllerName = options.mapControllerName ?? MAP;
			const featureSourcesControllerName =
				options.featureSourcesControllerName ?? FEATURE_SOURCES;
			const combinedFeatureSourceId = options.combinedFeatureSourceId;
			const getMembers = () =>
				options.getMembers?.() ?? options.members ?? [];

			function syncVisibleMembers() {
				const visibleFeatureSourceNames = getVisibleFeatureSourceNames(
					store.getState(),
					getMembers(),
					mapControllerName,
				);

				store.dispatch(
					mergeAll({
						[featureSourcesControllerName]: {
							[combinedFeatureSourceId]: {
								featureSourceNames: visibleFeatureSourceNames,
							},
						},
					}),
				);
			}

			observeState(
				store,
				(state) =>
					createVisibleLayerMembersObserverState(
						getMembers(),
						mapControllerName,
					)(state),
				syncVisibleMembers,
				isEqual,
			);

			syncVisibleMembers();
		},
	};
}

function normalizeVisibleLayerMembers(
	members: VisibleLayerMembers,
): VisibleLayerMember[] {
	if (Array.isArray(members)) {
		return members.map((featureSourceName) => ({
			featureSourceName,
			layerName: featureSourceName,
		}));
	}

	return Object.entries(members).map(([featureSourceName, layerName]) => ({
		featureSourceName,
		layerName,
	}));
}

function getVisibleFeatureSourceNames(
	state: State,
	members: VisibleLayerMembers,
	mapControllerName: string,
): string[] {
	const mapState = state[mapControllerName] as MapLayersState | undefined;

	return normalizeVisibleLayerMembers(members)
		.filter(
			({layerName}) => mapState?.layers?.[layerName]?.options?.visible,
		)
		.map(({featureSourceName}) => featureSourceName);
}

function createVisibleLayerMembersObserverState(
	members: VisibleLayerMembers,
	mapControllerName: string,
) {
	const normalizedMembers = normalizeVisibleLayerMembers(members);

	return (state: State) => {
		const mapState = state[mapControllerName] as MapLayersState | undefined;

		return {
			members: normalizedMembers,
			visibility: normalizedMembers.map(
				({layerName}) =>
					mapState?.layers?.[layerName]?.options?.visible,
			),
		};
	};
}
