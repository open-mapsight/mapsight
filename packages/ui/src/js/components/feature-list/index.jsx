import {deselectAll} from "@mapsight/core/lib/feature-selections/actions";
import {forwardRef, useCallback, useMemo, useRef} from "react";
import {useDispatch, useSelector} from "react-redux";

import {FEATURE_SELECTIONS} from "../../config/constants/controllers";
import getFeatureProperty from "../../helpers/get-feature-property";
import {
	layerSwitcherConfigExternalSelector,
	listUiOptionsSelector,
	viewSelector,
} from "../../store/selectors.ts";
import FeatureCycling from "../feature-list-cycling";

import FeatureSorter from "../feature-list-sorting";

import {
	APP_EVENT_SCROLL_TO_FEATURE_LIST,
	useAppChannelEventListener,
} from "../helping/app-channel";
import LayerSwitcher from "../layer-switcher/index.ts";
import TagSwitcher from "../tag-switcher/index.ts";

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
import Pagination from "./pagination.tsx";

export const DEFAULT_LIST_RENDER_AS = "ul";

function stopEventPropagation(e) {
	e.stopPropagation();
}

function determineShowListInfo(features) {
	if (features.length) {
		const firstInfo = getFeatureProperty(features[0], "listInformation");
		for (let i = 0; i < features.length; i++) {
			const info = getFeatureProperty(features[i], "listInformation");

			if (firstInfo !== info) {
				return true;
			}
		}
	}

	return false;
}

function determineItemType(containerType = DEFAULT_LIST_RENDER_AS) {
	if (containerType === "ul" || containerType === "ol") {
		return "li";
	}

	return "p";
}

/**
 * @template T
 * @param {import("../../types").FeatureListProps<T>} props props
 * @param {React.RefObject<React.ElementRef<T>>} forwardedRef ref
 * @returns {React.ReactElement} element
 */
function FeatureList(props, forwardedRef) {
	const {
		additionalClasses,
		as: T = "div",
		attributes = {},
		headerAs: HeaderT = FeatureListHeader,
		contentAs: ContentT = FeatureListGroupedContent,
		footerAs: FooterT = FeatureListFooter,
		itemAs,
		enableKeyboardControl = false,
		autoloadFeatureSource = true,
		sort = true,
		filter = true,
		enableScrollPosition = true,
		overrideListUiOptions,
		listControllerName,
	} = props;

	const listUiOptionsState = useSelector(listUiOptionsSelector);
	const listUiOptions = overrideListUiOptions || listUiOptionsState;
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

	/** @type {React.RefObject<HTMLElement>} */
	const headerRef = useRef();

	/** @type {React.RefObject<HTMLElement>} */
	const ownRef = useRef();

	/** @type {React.RefObject<HTMLElement>} */
	const ref = forwardedRef || ownRef;

	useMakeHeaderSticky(stickyHeader, ref, headerRef, view);
	useAutoloadFeatureSource(autoloadFeatureSource, state.featureSourceId);
	useRestoreDocumentScroll(view, state.scrollPosition);

	useAppChannelEventListener(
		APP_EVENT_SCROLL_TO_FEATURE_LIST,
		useCallback(() => {
			ref.current.scrollIntoView({block: "start", behavior: "smooth"});
		}, [ref]),
	);

	const dispatch = useDispatch();
	const selectFeatureAction = useSelectFeature();
	const selectFeature = useCallback(
		(featureId, options) =>
			dispatch(selectFeatureAction(featureId, options)),
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
		(showVaryingListInfoOnly === false ||
			determineShowListInfo(state.features));

	// TODO:
	//<StatusIndicator {...{
	//	lastUpdate: this.props.lastUpdate,
	//	status: this.props.status,
	//	key: 'si'
	//}} />

	let className = "ms3-list-wrapper";
	if (detailsInList) {
		className += " ms3-list-wrapper--with-details";
	}
	if (additionalClasses) {
		className += ` ${additionalClasses}`;
	}

	const itemProps = useMemo(
		() => ({
			showFeatureListInfo: showFeatureListInfo,
			enableKeyboardControl: enableKeyboardControl,
			selectFeature: selectFeature,
			deselectFeature: deselectFeature,
		}),
		[
			deselectFeature,
			enableKeyboardControl,
			selectFeature,
			showFeatureListInfo,
		],
	);

	const renderItemAs = itemAs || determineItemType(renderAs);
	const contextValue = useMemo(
		() =>
			/** @type {import("./context").FeatureListContextValue} */ ({
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
		cyclingControl,
		integratedList,
		paginationControl,
		itemsPerPage,
	} = listUiOptions;
	const {
		page,
		featureCount,
		features,
		featureSourceId,
		filteredFeatures,
		layerSwitcherShowExternal,
		tagSwitcherShow,
	} = state;

	let filterBox = null;
	if (filterControl !== false) {
		filterBox = <FeatureFilter allFeatures={features} />;
	} else if (sortControl !== false || !cyclingControl) {
		filterBox = <div className="ms3-list__filter-box">&nbsp;</div>;
	}

	return (
		<FeatureListContextProvider value={contextValue}>
			<T
				className={className}
				onTouchMove={stopEventPropagation}
				ref={ref}
				{...attributes}
			>
				<HeaderT ref={headerRef}>
					{filterBox}

					{sortControl !== false && <FeatureSorter />}

					{cyclingControl && (
						<FeatureCycling filteredFeatures={filteredFeatures} />
					)}

					{integratedList && layerSwitcherShowExternal && (
						<LayerSwitcher
							configSelector={layerSwitcherConfigExternalSelector}
						/>
					)}

					{integratedList && tagSwitcherShow && <TagSwitcher />}
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
			</T>
		</FeatureListContextProvider>
	);
}

export default forwardRef(FeatureList);
