import type {
	ElementType,
	ForwardedRef,
	ReactNode,
	RefObject,
	TouchEvent,
} from "react";
import {forwardRef, useCallback, useMemo, useRef} from "react";
import {useDispatch, useSelector} from "react-redux";

import {deselectAll} from "@mapsight/core/lib/feature-selections/actions";

import {FEATURE_SELECTIONS} from "../../config/constants/controllers";
import getFeatureProperty from "../../helpers/get-feature-property";
import {
	layerSwitcherConfigExternalSelector,
	listUiOptionsSelector,
	viewSelector,
} from "../../store/selectors";
import type {
	FeatureListProps,
	FullUiState,
	MapsightUiFeature,
	MapsightUiFeatureId,
	SelectFeatureActionOptions,
} from "../../types";
import FeatureCycling from "../feature-list-cycling";
import FeatureSorter from "../feature-list-sorting";
import {
	APP_EVENT_SCROLL_TO_FEATURE_LIST,
	useAppChannelEventListener,
} from "../helping/app-channel";
import LayerSwitcher from "../layer-switcher/index";
import TagSwitcher from "../tag-switcher/index";
import type {
	FeatureListContextValue,
	FeatureListItemContextProps,
} from "./context";
import {FeatureListContextProvider} from "./context";
import FeatureFilter from "./filter";
import FeatureListFooter from "./footer";
import FeatureListGroupedContent from "./grouped-content";
import FeatureListHeader from "./header";
import useAutoloadFeatureSource from "./hooks/useAutoloadFeatureSource";
import useFeatureListState from "./hooks/useFeatureListState";
import {useMakeHeaderSticky} from "./hooks/useMakeHeaderSticky";
import useRestoreDocumentScroll from "./hooks/useRestoreDocumentScroll";
import useSelectFeature from "./hooks/useSelectFeature";
import FeatureListLayerSwitcherControl from "./layer-switcher-control";
import Pagination from "./pagination";
import FeatureListTagSwitcherControl from "./tag-switcher-control";

export const DEFAULT_LIST_RENDER_AS = "ul";

function stopEventPropagation(e: TouchEvent<HTMLElement>) {
	e.stopPropagation();
}

function determineShowListInfo(features: MapsightUiFeature[]) {
	if (!features.length) {
		return false;
	}

	const firstInfo = getFeatureProperty(features[0]!, "listInformation");
	for (const feature of features) {
		const info = getFeatureProperty(feature, "listInformation");

		if (firstInfo !== info) {
			return true;
		}
	}

	return false;
}

function determineItemType(
	containerType: string = DEFAULT_LIST_RENDER_AS,
): "li" | "p" {
	if (containerType === "ul" || containerType === "ol") {
		return "li";
	}

	return "p";
}

function FeatureListInner(
	{
		additionalClasses,
		as: T = "div",
		attributes = {},
		headerAs: HeaderT = FeatureListHeader,
		contentAs: ContentT = FeatureListGroupedContent,
		footerAs: FooterT = FeatureListFooter,
		itemAs,
		itemDistanceLabelAs = null,
		enableKeyboardControl = false,
		autoloadFeatureSource = true,
		sort = true,
		filter = true,
		enableScrollPosition = true,
		overrideListUiOptions,
		listControllerName,
	}: FeatureListProps,
	forwardedRef: ForwardedRef<HTMLElement>,
) {
	const listUiOptionsState = useSelector(listUiOptionsSelector);
	const listUiOptions = (overrideListUiOptions ||
		listUiOptionsState) as FullUiState["list"];
	const {
		stickyHeader,
		detailsInList,
		showVaryingListInfoOnly,
		renderGroupAs,
		renderAs = DEFAULT_LIST_RENDER_AS,
		selectionBehaviorSelection,
	} = listUiOptions;
	const state = useFeatureListState(
		listUiOptions,
		sort,
		filter,
		enableScrollPosition,
		listControllerName,
	);
	const view = useSelector(viewSelector);

	if (renderAs === "table") {
		throw new Error(
			"@mapsight/ui does not support rendering the feature list as <table> anymore!",
		);
	}

	const headerRef = useRef<HTMLElement>(null);
	const ownRef = useRef<HTMLElement>(null);
	const ref = (forwardedRef ?? ownRef) as RefObject<HTMLElement>;

	useMakeHeaderSticky(stickyHeader, ref, headerRef, view);
	useAutoloadFeatureSource(autoloadFeatureSource, state.featureSourceId);
	useRestoreDocumentScroll(view, state.scrollPosition);

	useAppChannelEventListener(
		APP_EVENT_SCROLL_TO_FEATURE_LIST,
		useCallback(() => {
			ref.current?.scrollIntoView({block: "start", behavior: "smooth"});
		}, [ref]),
	);

	const dispatch = useDispatch();
	const selectFeatureAction = useSelectFeature();
	const selectFeature = useCallback(
		(
			featureId: MapsightUiFeatureId,
			_options?: SelectFeatureActionOptions,
		) => dispatch(selectFeatureAction(featureId) as never),
		[dispatch, selectFeatureAction],
	);
	const deselectFeature = useCallback(
		() =>
			dispatch(
				deselectAll(FEATURE_SELECTIONS, selectionBehaviorSelection),
			),
		[dispatch, selectionBehaviorSelection],
	);

	// Decide whether to show the info column
	// based on if there is any "interesting" aka distinct data available in the features
	// We do this before filtering so it does not change while changing the filter
	const showFeatureListInfo =
		state.filteredFeatures.length !== 0 &&
		(!showVaryingListInfoOnly || determineShowListInfo(state.features));

	let className = "ms3-list-wrapper";
	if (detailsInList) {
		className += " ms3-list-wrapper--with-details";
	}
	if (additionalClasses) {
		className += ` ${additionalClasses}`;
	}

	const itemProps = useMemo(
		(): FeatureListItemContextProps => ({
			showFeatureListInfo: showFeatureListInfo,
			enableKeyboardControl: enableKeyboardControl,
			selectFeature: selectFeature,
			deselectFeature: deselectFeature,
			distanceLabelAs: itemDistanceLabelAs,
		}),
		[
			deselectFeature,
			enableKeyboardControl,
			itemDistanceLabelAs,
			selectFeature,
			showFeatureListInfo,
		],
	);

	const renderItemAs = itemAs || determineItemType(renderAs);
	const contextValue = useMemo(
		(): FeatureListContextValue => ({
			state: state,
			listUiOptions: listUiOptions,
			enableKeyboardControl: enableKeyboardControl,
			showFeatureListInfo: showFeatureListInfo,
			selectFeature: selectFeature,
			deselectFeature: deselectFeature,
			itemProps: itemProps,
		}),
		[
			deselectFeature,
			enableKeyboardControl,
			listUiOptions,
			selectFeature,
			showFeatureListInfo,
			state,
			itemProps,
		],
	);

	const {
		filterControl,
		sortControl,
		layerSwitcherControl,
		tagSwitcherControl,
		cyclingControl,
		integratedList,
		paginationControl,
		itemsPerPage,
	} = listUiOptions;
	const {
		page,
		featureCount,
		featureSourceId,
		filteredFeatures,
		layerSwitcherShowExternal,
		tagSwitcherShow,
	} = state;

	let filterBox: ReactNode = null;
	if (filterControl) {
		filterBox = <FeatureFilter />;
	} else if (sortControl || !cyclingControl) {
		filterBox = <div className="ms3-list__filter-box">&nbsp;</div>;
	}

	const Wrapper = T as ElementType;

	return (
		<FeatureListContextProvider value={contextValue}>
			<Wrapper
				className={className}
				onTouchMove={stopEventPropagation}
				ref={ref}
				{...attributes}
			>
				<HeaderT ref={headerRef}>
					{filterBox}

					{sortControl && <FeatureSorter />}

					{cyclingControl && (
						<FeatureCycling filteredFeatures={filteredFeatures} />
					)}

					{integratedList &&
						layerSwitcherShowExternal &&
						(layerSwitcherControl ? (
							<FeatureListLayerSwitcherControl />
						) : (
							<LayerSwitcher
								configSelector={
									layerSwitcherConfigExternalSelector
								}
							/>
						))}

					{integratedList &&
						tagSwitcherShow &&
						(tagSwitcherControl ? (
							<FeatureListTagSwitcherControl />
						) : (
							<TagSwitcher />
						))}
				</HeaderT>
				<ContentT
					groupAs={renderGroupAs}
					itemAs={renderItemAs}
					featureSourceId={featureSourceId}
				/>
				<FooterT>
					{paginationControl ? (
						<Pagination
							page={page}
							count={Math.ceil(featureCount / itemsPerPage)}
						/>
					) : null}
				</FooterT>
			</Wrapper>
		</FeatureListContextProvider>
	);
}

export default forwardRef(FeatureListInner);
