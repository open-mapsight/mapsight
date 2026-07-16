import type {ComponentType, ElementType, HTMLAttributes} from "react";

import type {
	AnyAction,
	Reducer,
	Store,
	StoreEnhancer,
	ThunkAction,
} from "@reduxjs/toolkit";
import type {BatchAction} from "redux-batched-actions";

import type {BaseController} from "@mapsight/core/lib/base/controller";
import type {FeatureSourceState} from "@mapsight/core/lib/feature-sources/types";
import type {EnhancedStore, Feature, State} from "@mapsight/core/types";

import type {MapsightStyleFunction} from "@mapsight/lib-ol/style/styleFunction";

import type {FeatureListItemDistanceLabelProps} from "./components/feature-list-item/types";
import type {MapsightUiPlacesData} from "./components/feature-list-sorting/feature-list-sorting";
import type {View} from "./config/constants/app";
import type {TAG_FILTER, TIME_FILTER} from "./config/constants/controllers";
import type {MapsightConfig} from "./config/schema";
import type {MapsightUiComponents} from "./helpers/components";
import type {FETCH_JSON_STATUS, FETCH_TEXT_STATUS} from "./store/actions";
import type {RootStateSlice} from "./store/selectors";

// helper type https://stackoverflow.com/a/61132308
export type DeepPartial<T> = T extends object
	? {
			[P in keyof T]?: DeepPartial<T[P]>;
		}
	: T;

export type MapsightUiStore = EnhancedStore<RootStateSlice>;

/**
 * We keep a context object for each mapsight ui instance holding all the information
 * plugins will be passed this object and may manipulate it's properties
 */
export type MapsightUiContext = {
	/** indicates if the instance has been rendered at least once (available after init) */
	hasRendered: boolean;
	/** the container element the instance should be rendered into (available after init) */
	container: HTMLElement | null;
	/** the mapsight core vector style function (see @mapsight/core) (available after init) */
	styleFunction: MapsightStyleFunction;
	/** base mapsight config (available after init) TODO: document further */
	baseMapsightConfig: Partial<MapsightConfig>;
	/** options on how to create the mapsight app (available after init) */
	createOptions: CreateOptions;
	/** array of app channel listener definitions (available after init) */
	appChannelListeners: AppChannelListenerDefinition[];
	/** initial state (available after init) TODO: document further */
	initialState?: DeepPartial<{app: UiState}>;
	/** indicates if the instance has been re-hydrated (available after init) */
	isStateReHydrated?: boolean;
	/** map of controllers (available after init) */
	controllers?: Record<string, BaseController>;
	/** redux store enhancer (available after create) */
	storeEnhancer?: StoreEnhancer;
	/** redux store (available after create) */
	store?: MapsightUiStore;
	/**
	 * Function to render the app (available after create). Render without waiting for plugins
	 * (for e.g. waiting on external data).
	 */
	render?: MapsightUiRenderFunction<any>;
	/**
	 * Function to render the app async (available after create). Render allowing plugins to
	 * delay render (for e.g. waiting on external data).
	 */
	renderAsync?: MapsightUiAsyncRenderFunction<any>;
	/** indicates whether the render is delayed by a promise returned by the plugin function
	 * (available before render) */
	canPluginsDelayRender?: boolean;
	/** props to be rendered (available after render) */
	rendererProps?: ExternalMapsightUiRendererProps;
	/** the reference that may have been returned by the renderer (available after render)*/
	renderRef?: any;
};

/**
 * plugin function that gets called
 */
export type PluginFunction = (
	context: MapsightUiContext,
) => // TODO: return `Promise<unknown> | unknown`?
Promise<unknown> | void;

export type PluginPhase =
	"afterInit" | "afterCreate" | "beforeRender" | "afterRender";

/**
 * plugin instance
 */
export type PluginInstance = {
	/** optional plugin to be called after initialization */
	afterInit?: PluginFunction;
	/** optional plugin to be called after creation */
	afterCreate?: PluginFunction;
	/** optional plugin to be called after rendering */
	beforeRender?: PluginFunction;
	/** optional plugin to be called after rendering */
	afterRender?: PluginFunction;
};

export type PluginDefinition = [string, null | PluginInstance];

export type InternalMapsightUiRendererProps = {
	store: Store<State>;
	components: MapsightUiComponents;
	appChannelListeners: AppChannelListenerDefinition[];
};

export type ExternalMapsightUiRendererProps = {
	requestUrlSearch?: string;
	title?: string;
};

export type MapsightUiRendererProps = ExternalMapsightUiRendererProps &
	InternalMapsightUiRendererProps;

/**
 * @param container the container element the instance should be rendered into
 * @param props props to render
 * @param hydrate whether to hydrate existing render target, default: false
 * @returns may return a value depending on the renderer
 */
export type MapsightUiRenderer<R = undefined> = (
	container: null | HTMLElement,
	props: MapsightUiRendererProps,
	hydrate: boolean | undefined,
) => R;

/**
 * @param rendererProps props to render
 * @returns may return a value depending on the renderer
 */
export type MapsightUiRenderFunction<R> = (
	rendererProps: ExternalMapsightUiRendererProps,
) => R;

/**
 * @param rendererProps props to render
 * @returns may return a value depending on the renderer
 */
export type MapsightUiAsyncRenderFunction<R> = (
	rendererProps: ExternalMapsightUiRendererProps,
) => Promise<R>;

export type MapsightUiView = View;

export type LayerSwitcherConfigState = {
	setFeatureSourceId: string[] | true | undefined;
	grouped: boolean;
	layerIdsSelector: (state: object) => string[];
	splitBaseLayers?: boolean;
};

export type FetchTextState = {
	url: string | null;
	status: FETCH_TEXT_STATUS;
	data: string | null;
	error: string | null;
	lastUpdate: number | null;
};

export type FetchJsonState<TData = unknown> = {
	url: string | null;
	status: FETCH_JSON_STATUS;
	data: TData | null;
	error: string | null;
	lastUpdate: number | null;
};

export type RegionState = {
	label: string;
	bounds: [number, number, number, number];
};

export type RegionsState = Record<string, RegionState>;

export type ListDefaultSortingConfig = {
	place: string;
	preferGeolocation?: boolean;
};

export type ListDefaultSortingConfigByFeatureSource = Record<
	string,
	ListDefaultSortingConfig
>;

export type FullUiState = {
	isFullscreen: boolean;

	regions: RegionsState;
	selectedRegion: string;

	places: MapsightUiPlacesData;

	embeddedMap: boolean;

	title: string;

	metaTags: Array<{
		name: string | undefined;
		property: string | undefined;
		content: string;
	}>;

	searchInMap: boolean;
	searchQuery: string;
	searchResult: FeatureSourceState & {
		status: "error" | "loading" | "success" | null;
	};
	searchResultSelectionFeatures: MapsightUiFeature[];

	view: MapsightUiView;
	viewDefaultDesktop: "desktop" | "fullscreen";
	viewDefaultMobile: "mobile" | "mapOnly";
	viewBreakpoints: MapsightUiView[];
	mapIsOutOfViewport: boolean;

	isOverlayModalVisible: boolean;

	userPreferenceListVisible: boolean;
	listSorting: string;
	listDefaultSortingByFeatureSource?: ListDefaultSortingConfigByFeatureSource;
	listQuery: string;
	listPage: number;
	lastListScrollPosition: number;

	featureSelectionInfo: {
		stuckHeaderHeight: number;
		stickyHeader: boolean;
	};
	pageTitle: {
		show: boolean;
	};
	list: {
		show: boolean;
		selectOnClick: true | false | "mainAndIcon";
		showVaryingListInfoOnly: boolean;
		cyclingControl: boolean;
		deselectOnClick: boolean;
		filterControl: boolean;
		paginationControl: boolean;
		selectionBehavior: {
			desktop: "scrollToMap" | null;
			mobile: "expandInList" | "scrollToMap" | "showInMapOnlyView" | null;
		};
		selectionBehaviorSelection: "select" | "preselect";
		scrollToItemOnPreselect: boolean;
		showSelectedOnly: boolean;
		itemsPerPage: number;
		stickyHeader: boolean;
		highlightOnMouse: boolean;
		sortControl: boolean;
		layerSwitcherControl: boolean;
		tagSwitcherControl: boolean;
		detailsInList: boolean;
		integratedList: boolean;
		renderAs: string;
		renderGroupAs: string;
	};
	viewToggle: {
		show: boolean;
		deselectFeaturesOnToggle: boolean;
	};
	layerSwitcher: {
		show: {
			internal: boolean;
			external: boolean;
		};
		internal: LayerSwitcherConfigState;
		external: LayerSwitcherConfigState;
	};
	tagSwitcher: {
		show: boolean;
		featureSourceId: string;
		featureSourcesControllerName: string;
		sortTags: boolean;
		toggleableGroups: boolean;
	};
	map: {
		show: boolean;
	};
	[TIME_FILTER]: {
		show: boolean;
	};
	[TAG_FILTER]: {
		show: boolean;
		featureSourceId: string;
	};
	miniLegendLayer: string;
};

export type UiState = DeepPartial<FullUiState>;

export type AppChannelListenerDefinition = [string, EventListener];

export type SiteConfig = {
	baseUrl: string;
	imagesUrl: string;
	searchUrl: string;
	searchQueryParameter: string;
	topOffsetForView: (view: string) => number;
	lang?: string;
};

export type MapsightUiReHydrationState = {
	app: UiState;
	[x: string | number | symbol]: unknown; // TODO: add type defs in @mapsight/core for state
};

// TODO: Move these to @mapsight/core types
export type MapsightCoreAction = AnyAction &
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	ThunkAction<any, any, any, any> &
	BatchAction;

/**
 * @deprecated Use `State` from `@mapsight/core/types` or `MapsightConfig` from
 * `@mapsight/ui/schema` for config ingress. Kept for legacy app reducer typing.
 */
export type MapsightCoreState =
	string | number | Array<MapsightCoreState | null | undefined> | object;
/** @deprecated Prefer `Reducer<T, MapsightCoreAction>` with a concrete slice type. */
export type MapsightCoreReducer<
	T extends MapsightCoreState = MapsightCoreState,
	U extends MapsightCoreAction = MapsightCoreAction,
> = Reducer<T, U>;

export type MapsightUiAppReducer = MapsightCoreReducer<UiState>;

export type CreateOptions = {
	/** Validate Mapsight config ingress in development (default: true in dev). */
	validateConfig?: boolean;

	// store
	storeEnhancer?: StoreEnhancer;
	reducers?: {
		[x: string]: undefined | MapsightCoreReducer;
		app?: MapsightUiAppReducer;
	};
	uiState?: UiState;

	// functionality
	plugins?: PluginDefinition[];
	controllers?: Record<string, BaseController>;

	// rendering
	components?: MapsightUiComponents;
	renderer?: MapsightUiRenderer<any>;
	dehydratedStateAttributeName?: string;
	reHydratedState?: MapsightUiReHydrationState;
	renderBreakpoints?: Record<string, [number, number]>;
	partialChangeHandler?: EventListener;

	appChannelListeners?: AppChannelListenerDefinition[];
} & Partial<SiteConfig>;

export type MapsightUiFeatureProperty =
	| "title"
	| "description"
	| "listInformation"
	| "detailsUrl"
	| "group"
	| "mapsightIconId"
	| "listName"
	| "name"
	| "tooltip"
	| "tagGroups"
	| "permanentLink"
	| "overrideListHtml"
	| "isIncompleteSuggest";

export type MapsightUiFeatureId = string | number;

export type MapsightUiFeature = Feature & {
	id: MapsightUiFeatureId;
	// TODO: Why are we using `object` here instead of the default `Geometry` type?
	geometry: object;
	properties: Record<MapsightUiFeatureProperty, any> & {
		id: MapsightUiFeatureId;
	};
	bbox?: [number, number, number, number];
};

export type MainPanelPosition = "left" | "below";
export type MainPanelContentType = "selectionInfo" | "list" | null;

export type MainPanelContextOptions = {
	showSelectionInfo: boolean;
	showList: boolean;
	collapsible: boolean;
	panelPosition: MainPanelPosition;
};

export type MainPanelContextState = {
	feature: MapsightUiFeature | null;
	contentType: MainPanelContentType;
	collapsed: boolean;
};

export type MainPanelContextValue = MainPanelContextOptions &
	MainPanelContextState;

export type FeatureListProps<T extends ElementType = "div"> = {
	additionalClasses?: string | null;
	as?: T;
	attributes?: HTMLAttributes<HTMLElement> & Record<string, unknown>;
	headerAs?: ElementType;
	contentAs?: ElementType;
	footerAs?: ElementType;
	itemAs?: ElementType;
	itemDistanceLabelAs?: ComponentType<FeatureListItemDistanceLabelProps> | null;
	enableKeyboardControl?: boolean;
	autoloadFeatureSource?: boolean;
	sort?: boolean;
	filter?: boolean;
	enableScrollPosition?: boolean;
	overrideListUiOptions?: Partial<FullUiState["list"]>;
	listControllerName?: string;
};

export type SelectFeatureActionOptions = {
	keyboard?: boolean;
};
