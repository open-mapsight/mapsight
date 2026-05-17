import type {ComponentType, ElementType, ReactElement} from "react";
import {createElement, useMemo} from "react";

import type {Feature} from "@mapsight/core/types";

import getFeatureProperty from "../../../helpers/get-feature-property";
import type {MapsightUiFeature} from "../../../types";
import FeatureListItem from "../../feature-list-item";

export interface MapsightUiListGroup {
	name: string;
	features: Feature[];
}

function determineFeatureGroups(
	features: MapsightUiFeature[],
): MapsightUiListGroup[] {
	const groups: MapsightUiListGroup[] = [];

	const defaultGroup = createGroup("");
	groups[0] = defaultGroup;

	features.forEach((feature) => {
		const featureGroupName = getFeatureProperty(feature, "group") as string;

		if (!featureGroupName) {
			defaultGroup.features.push(feature);
		} else {
			// find group and add feature to it
			let group = findGroup(groups, featureGroupName);
			if (!group) {
				group = createGroup(featureGroupName);
				groups.push(group);
			}
			group.features.push(feature);
		}
	});

	// reset if no groups found in data
	// TODO discuss with paul, if we should show an empty header for the group without name and
	//  if to show that even if there's no other group
	if (groups.length === 1) {
		return [];
	}

	// remove default group if there are no features left
	if (!groups[0].features.length) {
		groups.shift();
	}

	return groups;
}

function createGroup(name: string): MapsightUiListGroup {
	return {name: name, features: []};
}

function findGroup(
	groups: MapsightUiListGroup[],
	name: string,
): undefined | MapsightUiListGroup {
	return groups.find((g) => g.name === name);
}

const renderItems = (
	features: Feature[],
	as: ComponentType<{feature: Feature}>,
	itemProps: Record<string, unknown>,
) => {
	const Component = typeof as === "string" ? FeatureListItem : as;
	return features.map((feature) =>
		createElement(Component, {
			...itemProps,
			key: feature.id,
			feature: feature,
		}),
	);
};

export type ItemGroups = {
	groups: null | MapsightUiListGroup[];
	items: Array<Array<ReactElement>>;
};

function calcAndRenderGroupedFeatureItems(
	enableGrouping: boolean,
	features: MapsightUiFeature[],
	itemAs: ComponentType<{feature: Feature}>,
	itemProps: Record<string, unknown>,
): ItemGroups {
	if (enableGrouping && features.length) {
		const groups = determineFeatureGroups(features);
		if (groups && groups.length) {
			return {
				groups: groups,
				items: groups.map((group) =>
					renderItems(group.features, itemAs, itemProps),
				),
			};
		}
	}

	return {
		groups: null,
		items: features.length
			? [renderItems(features, itemAs, itemProps)]
			: [],
	};
}

export default function useFeatureListItemGroups(
	groupAs: ElementType,
	features: MapsightUiFeature[],
	itemAs: ComponentType<{feature: Feature}>,
	itemProps: Record<string, unknown>,
): ItemGroups {
	return useMemo(
		() =>
			calcAndRenderGroupedFeatureItems(
				!!groupAs,
				features,
				itemAs,
				itemProps,
			),
		[groupAs, features, itemAs, itemProps],
	);
}
