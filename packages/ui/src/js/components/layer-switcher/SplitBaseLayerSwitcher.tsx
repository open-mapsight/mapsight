import {
	type ElementType,
	type ReactNode,
	useCallback,
	useId,
	useState,
} from "react";
import {connect, shallowEqual} from "react-redux";

import {createSelector} from "@reduxjs/toolkit";

import type {MapState} from "@mapsight/core/lib/map/types";
import type {State} from "@mapsight/core/types";

import {MAP} from "../../config/constants/controllers";
import {Heading, HeadingContent, useHeadingElement} from "../../headings";
import {translate} from "../../helpers/i18n";
import SwitcherRadioGroup from "../switcher/SwitcherRadioGroup";

type LayerGroup = {
	group: string;
	layerIds: string[];
	visibleCount: number;
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
	/** When true, overlay groups can collapse and show visible/total counts. */
	collapsibleGroups?: boolean;
	/** Section title element; use a non-heading tag for control labels. Default h3. */
	headlineAs?: ElementType;
	/** Overlay group title element. Default h4. */
	groupHeadlineAs?: ElementType;
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
			visibleCount: layerIds.filter(
				(layerId) => layers[layerId]?.options?.visible === true,
			).length,
		})),
		ungroupedLayerIds,
	};
}

function CollapsibleOverlayGroup({
	group,
	layerIds,
	visibleCount,
	collapsed,
	onToggle,
	renderEntry,
	groupHeadlineAs: GroupHeadline,
}: {
	groupHeadlineAs: ElementType;
	group: string;
	layerIds: string[];
	visibleCount: number;
	collapsed: boolean;
	onToggle: () => void;
	renderEntry: (id: string, group?: string | null) => ReactNode;
}) {
	const panelId = useId();
	const total = layerIds.length;
	const countLabel = `${visibleCount}/${total}`;
	const toggleLabel = collapsed
		? translate("ui.layer-switcher.expandGroup")
		: translate("ui.layer-switcher.collapseGroup");

	return (
		<section
			className={`ms3-grouped-switcher__group${
				collapsed ? " ms3-grouped-switcher__group--collapsed" : ""
			}${
				visibleCount > 0
					? " ms3-grouped-switcher__group--has-visible"
					: ""
			}`}
			data-ms3-switcher-group={group}
		>
			<Heading
				as={GroupHeadline}
				className="ms3-layer-switcher__header ms3-grouped-switcher__header"
				data-ms3-switcher-header-group={group}
			>
				<button
					type="button"
					className="ms3-grouped-switcher__toggle"
					aria-expanded={!collapsed}
					aria-controls={panelId}
					aria-label={`${group} ${countLabel} ${toggleLabel}`}
					onClick={onToggle}
				>
					<span className="ms3-switcher-header__label">{group}</span>{" "}
					<span className="ms3-grouped-switcher__meta">
						<span
							className="ms3-grouped-switcher__count"
							data-ms3-count={visibleCount}
							data-ms3-count-total={total}
						>
							{countLabel}
						</span>
						<span
							className="ms3-grouped-switcher__chevron"
							aria-hidden="true"
						/>
					</span>
				</button>
			</Heading>
			<HeadingContent headingAs={GroupHeadline}>
				<ul
					id={panelId}
					className="ms3-layer-switcher__entries"
					data-ms3-switcher-entries-group={group}
					hidden={collapsed}
				>
					{layerIds.map((layerId) => renderEntry(layerId, group))}
				</ul>
			</HeadingContent>
		</section>
	);
}

function SplitBaseLayerSwitcher({
	baseLayerIds,
	groups,
	ungroupedLayerIds,
	renderBaseLayerEntry,
	renderEntry,
	collapsibleGroups = false,
	headlineAs,
	groupHeadlineAs,
}: SplitBaseLayerSwitcherStateProps & SplitBaseLayerSwitcherOwnProps) {
	const Headline = useHeadingElement("switcher", "h3", headlineAs);
	const GroupHeadline = useHeadingElement(
		"switcherGroup",
		"h4",
		groupHeadlineAs,
		{parentAs: Headline},
	);
	const baseLayersHeadingId = useId();
	const hasOverlayLayers = groups.length > 0 || ungroupedLayerIds.length > 0;
	/** Explicit user overrides; unset keys use the default (collapsed when none visible). */
	const [collapsedByGroup, setCollapsedByGroup] = useState<
		Record<string, boolean>
	>({});

	const isGroupCollapsed = useCallback(
		(group: string, visibleCount: number) => {
			if (!collapsibleGroups) {
				return false;
			}
			if (Object.prototype.hasOwnProperty.call(collapsedByGroup, group)) {
				return collapsedByGroup[group] === true;
			}
			return visibleCount === 0;
		},
		[collapsedByGroup, collapsibleGroups],
	);

	const toggleGroup = useCallback(
		(group: string, currentlyCollapsed: boolean) => {
			setCollapsedByGroup((previous) => ({
				...previous,
				[group]: !currentlyCollapsed,
			}));
		},
		[],
	);

	return (
		<div
			className={`ms3-layer-switcher ms3-layer-switcher--split-base-layers${
				collapsibleGroups
					? " ms3-layer-switcher--collapsible-groups"
					: ""
			}`}
		>
			{baseLayerIds.length > 0 ? (
				<section className="ms3-layer-switcher__section ms3-layer-switcher__section--base-layers">
					<Heading
						as={Headline}
						id={baseLayersHeadingId}
						className="ms3-layer-switcher__section-title"
					>
						{translate("ui.layer-switcher.baseLayers")}
					</Heading>
					<HeadingContent headingAs={Headline}>
						<SwitcherRadioGroup
							className="ms3-layer-switcher__entries ms3-layer-switcher__entries--base-layers"
							aria-labelledby={baseLayersHeadingId}
						>
							{baseLayerIds.map((layerId) =>
								renderBaseLayerEntry(layerId, null),
							)}
						</SwitcherRadioGroup>
					</HeadingContent>
				</section>
			) : null}

			{hasOverlayLayers ? (
				<section className="ms3-layer-switcher__section ms3-layer-switcher__section--overlay-layers">
					<Heading
						as={Headline}
						className="ms3-layer-switcher__section-title"
					>
						{translate("ui.layer-switcher.overlayLayers")}
					</Heading>
					<HeadingContent headingAs={Headline}>
						<div className="ms3-grouped-switcher ms3-grouped-switcher--wrapped">
							{groups.map(({group, layerIds, visibleCount}) => {
								const collapsed = isGroupCollapsed(
									group,
									visibleCount,
								);

								return collapsibleGroups ? (
									<CollapsibleOverlayGroup
										groupHeadlineAs={GroupHeadline}
										key={group}
										group={group}
										layerIds={layerIds}
										visibleCount={visibleCount}
										collapsed={collapsed}
										onToggle={() =>
											toggleGroup(group, collapsed)
										}
										renderEntry={renderEntry}
									/>
								) : (
									<section
										key={group}
										className="ms3-grouped-switcher__group"
										data-ms3-switcher-group={group}
									>
										<Heading
											as={GroupHeadline}
											className="ms3-layer-switcher__header"
											data-ms3-switcher-header-group={
												group
											}
										>
											<span className="ms3-switcher-header__label">
												{group}
											</span>
										</Heading>
										<HeadingContent
											headingAs={GroupHeadline}
										>
											<ul
												className="ms3-layer-switcher__entries"
												data-ms3-switcher-entries-group={
													group
												}
											>
												{layerIds.map((layerId) =>
													renderEntry(layerId, group),
												)}
											</ul>
										</HeadingContent>
									</section>
								);
							})}

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
					</HeadingContent>
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
