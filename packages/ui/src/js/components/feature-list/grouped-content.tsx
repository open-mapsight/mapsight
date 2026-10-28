import type {ElementType, ForwardedRef, ReactNode} from "react";
import {Fragment, forwardRef, memo, useMemo, useRef} from "react";
import {useDispatch, useSelector} from "react-redux";

import {async} from "@mapsight/core/lib/base/actions";
import {load} from "@mapsight/core/lib/feature-sources/actions";
import type {State} from "@mapsight/core/types";

import {FEATURE_SOURCES} from "../../config/constants/controllers";
import {Heading, HeadingContent, useHeadingElement} from "../../headings";
import {translate} from "../../helpers/i18n";
import {
	featureSourceToView,
	useAsyncStatusDisplay,
} from "../../lib/async-status";
import type {MapsightUiStore} from "../../types";
import AsyncStatusRegion from "../async-status/AsyncStatusRegion";
import {combinedMemberSourcesSelector} from "./combined-member-sources-selector";
import type {FeatureListContentProps} from "./content";
import FeatureListContent from "./content";
import {useFeatureListContext} from "./context";
import FeatureListEmptyMessage from "./empty-message";
import useFeatureListItemGroups from "./hooks/useFeatureListItemGroups";
import useKeyboardNavigation from "./hooks/useKeyboardNavigation";

export type FeatureListGroupedContentProps = FeatureListContentProps & {
	groupAs?: ElementType | "auto" | null;
	itemAs?: ElementType;
};

function featureListStatusFromPhase(
	phase: ReturnType<typeof useAsyncStatusDisplay>["phase"],
) {
	if (phase === "loading" || phase === "refreshing") {
		return "loading";
	}
	if (phase === "error") {
		return "error";
	}
	return undefined;
}

function FeatureListGroupedContent(
	{
		as: T = "div",
		groupAs = null,
		itemAs,
		...attributes
	}: FeatureListGroupedContentProps,
	forwardedRef: ForwardedRef<HTMLElement>,
) {
	const GroupNameT = useHeadingElement(
		"featureListGroup",
		"h3",
		groupAs === "auto" ? undefined : (groupAs ?? undefined),
	);
	const ownRef = useRef<HTMLElement>(null);
	const ref = forwardedRef || ownRef;
	const dispatch = useDispatch<MapsightUiStore["dispatch"]>();

	const {
		state: {
			filteredFeatures: features = [],
			featureSourceId,
			featureSource,
		},
		itemProps,
		listUiOptions: {renderAs: listAs = "ul"},
		enableKeyboardControl,
	} = useFeatureListContext();
	const rootProps = useKeyboardNavigation(enableKeyboardControl, ref);

	const listProps: FeatureListContentProps = {
		...attributes,
		as: listAs as ElementType,
		emptyAs: listAs === "ul" || listAs === "ol" ? "li" : "div",
		featureSourceId,
	};

	const hasSource =
		featureSourceId !== null &&
		featureSourceId !== undefined &&
		featureSourceId !== "";

	const memberSources = useSelector((state: State) =>
		combinedMemberSourcesSelector(state, featureSource),
	);

	const view = useMemo(
		() =>
			featureSourceToView(featureSource, {
				enabled: hasSource,
				memberSources,
				refetch: hasSource
					? () =>
							dispatch(
								async(load(FEATURE_SOURCES, featureSourceId)),
							)
					: undefined,
			}),
		[dispatch, featureSource, featureSourceId, hasSource, memberSources],
	);

	const display = useAsyncStatusDisplay(view, {
		isEmpty: () => features.length === 0 && view.status === "success",
	});
	const listStatus = featureListStatusFromPhase(display.phase);

	const itemGroups = useFeatureListItemGroups(
		groupAs,
		features,
		itemAs || (listAs === "ul" || listAs === "ol" ? "li" : "p"),
		itemProps,
	);

	const emptyMessage = (
		<FeatureListContent status={listStatus} {...listProps} {...rootProps}>
			<FeatureListEmptyMessage
				as={listProps.emptyAs}
				hasSource={hasSource}
			/>
		</FeatureListContent>
	);

	let listContent: ReactNode = null;

	if (features.length) {
		if (itemGroups.groups) {
			listContent = (
				<T className="ms3-list-groups ms3-scroll-target" {...rootProps}>
					{itemGroups.groups.map(function composeGroup(group, index) {
						return (
							<Fragment key={group.name}>
								{group.name ? (
									<Heading
										as={GroupNameT}
										className="ms3-list__group ms3-list__group--name"
									>
										{group.name}
									</Heading>
								) : null}

								<HeadingContent
									headingAs={
										group.name ? GroupNameT : undefined
									}
								>
									<FeatureListContent
										data-ms3-group-name={group.name}
										status={listStatus}
										{...listProps}
									>
										{itemGroups.items[index]}
									</FeatureListContent>
								</HeadingContent>
							</Fragment>
						);
					})}
				</T>
			);
		} else {
			listContent = (
				<FeatureListContent
					status={listStatus}
					{...listProps}
					{...rootProps}
				>
					{itemGroups.items[0]}
				</FeatureListContent>
			);
		}
	}

	return (
		<AsyncStatusRegion
			emptyMessage={emptyMessage}
			errorMessage={translate("ui.feature-list.error")}
			isEmpty={() => features.length === 0 && view.status === "success"}
			loadingMessage={translate("ui.feature-list.loading")}
			onRetry={view.refetch}
			variant="placeholder"
			view={view}
		>
			{listContent}
		</AsyncStatusRegion>
	);
}

export default memo(forwardRef(FeatureListGroupedContent));
