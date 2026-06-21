import {Fragment, forwardRef, memo, useMemo, useRef} from "react";
import {useDispatch, useSelector} from "react-redux";

import {async} from "@mapsight/core/lib/base/actions";
import {load} from "@mapsight/core/lib/feature-sources/actions";

import {FEATURE_SOURCES} from "../../config/constants/controllers";
import {translate} from "../../helpers/i18n";
import {
	featureSourceToView,
	useAsyncStatusDisplay,
} from "../../lib/async-status";
import AsyncStatusRegion from "../async-status/AsyncStatusRegion";
import FeatureListContent from "./content";
import {useFeatureListContext} from "./context";
import FeatureListEmptyMessage from "./empty-message";
import useFeatureListItemGroups from "./hooks/useFeatureListItemGroups";
import useKeyboardNavigation from "./hooks/useKeyboardNavigation";

function featureListStatusFromPhase(phase) {
	if (phase === "loading" || phase === "refreshing") {
		return "loading";
	}
	if (phase === "error") {
		return "error";
	}
	return undefined;
}

function FeatureListGroupedContent(
	{as: T = "div", groupAs = null, itemAs, ...listProps},
	forwardedRef,
) {
	const ownRef = useRef();
	const ref = forwardedRef || ownRef;
	const dispatch = useDispatch();

	const {
		state: {
			filteredFeatures: features = [],
			featureSourceId,
			featureSource,
		},
		itemProps,
		enableKeyboardControl,
	} = useFeatureListContext();
	const rootProps = {
		...useKeyboardNavigation(enableKeyboardControl, ref),
		ref: ref,
	};

	listProps.emptyAs = itemProps.as;
	listProps.featureSourceId = featureSourceId;

	const hasSource =
		featureSourceId !== null &&
		featureSourceId !== undefined &&
		featureSourceId !== "";

	const memberSources = useSelector((state) => {
		if (featureSource?.type !== "combined") {
			return undefined;
		}

		const names = featureSource.featureSourceNames ?? [];
		if (!names.length) {
			return [];
		}

		const sources = state[FEATURE_SOURCES];
		return names.map((name) => sources?.[name]);
	});

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
		itemAs,
		itemProps,
	);

	const emptyMessage = (
		<FeatureListContent status={listStatus} {...listProps} {...rootProps}>
			<FeatureListEmptyMessage as={itemProps.as} hasSource={hasSource} />
		</FeatureListContent>
	);

	let listContent = null;

	if (features.length) {
		if (itemGroups.groups) {
			const GroupNameT = groupAs;

			listContent = (
				<T className="ms3-list-groups ms3-scroll-target" {...rootProps}>
					{itemGroups.groups.map(function composeGroup(group, index) {
						return (
							<Fragment key={group.name}>
								{group.name ? (
									<GroupNameT className="ms3-list__group ms3-list__group--name">
										{group.name}
									</GroupNameT>
								) : null}

								<FeatureListContent
									data-ms3-group-name={group.name}
									status={listStatus}
									{...listProps}
								>
									{itemGroups.items[index]}
								</FeatureListContent>
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
