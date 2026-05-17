import type {Store, StoreEnhancer} from "redux";

import type {BaseController} from "@mapsight/core/lib/base/controller";
import type {EnhancedStore, Feature, State} from "@mapsight/core/types";

import type {MapsightStyleFunction} from "@mapsight/lib-ol/style/styleFunction";

import type {MapsightUiPlacesData} from "./components/feature-list-sorting/feature-list-sorting.tsx";
import type {View} from "./config/constants/app.ts";
import type {MapsightUiComponents} from "./helpers/components";

// helper type https://stackoverflow.com/a/61132308
export type DeepPartial<T> = T extends object
	? {
			[P in keyof T]?: DeepPartial<T[P]>;
		}
	: T;

export type MapsightUiStore = EnhancedStore<{app: UiState}>;

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
	baseMapsightConfig: Partial<State>;
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
	| "afterInit"
	| "afterCreate"
	| "beforeRender"
	| "afterRender";

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

export type FullUiState = {
	isFullscreen: boolean;

	regions: Record<
		string,
		{
			label: string;
			bounds: [number, number, number, number];
		}
	>;
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
	searchResult: {
		url: string;
		status: "error" | "loading" | "success" | null;
		data: unknown;
		error: unknown;
		lastUpdate: number | null;
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
		internal: {
			grouped: boolean;
			layerIdsSelector: (state: object) => string[];
		};
		external: {
			grouped: boolean;
			layerIdsSelector: (state: object) => string[];
		};
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
	timeFilter: {
		show: boolean;
	};
	tagFilter: {
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
export type MapsightCoreAction = import("redux").AnyAction &
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	import("redux-thunk").ThunkAction<any, any, any, any> &
	import("redux-batched-actions").BatchAction;
export type MapsightCoreState =
	| string
	| number
	| Array<MapsightCoreState | null | undefined>
	| object;
export type MapsightCoreReducer<
	T extends MapsightCoreState = MapsightCoreState,
	U extends MapsightCoreAction = MapsightCoreAction,
> = import("redux").Reducer<T, U>;

export type MapsightUiAppReducer = MapsightCoreReducer<UiState>;

export type CreateOptions = {
	// store
	storeEnhancer?: import("redux").StoreEnhancer;
	reducers?: {
		[x: string]: undefined | MapsightCoreReducer;
		app?: MapsightUiAppReducer;
	};
	uiState?: UiState;

	// functionality
	plugins?: PluginDefinition[];
	controllers?: Record<
		string,
		import("@mapsight/core/lib/base/controller").BaseController
	>;

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

export type FeatureListProps<T extends import("react").ElementType = "div"> = {
	additionalClasses?: string | null;
	as?: T;
	attributes?: import("react").HTMLAttributes<T>;
	headerAs?: null | import("react").ElementType;
	contentAs?: null | import("react").ElementType;
	footerAs?: null | import("react").ElementType;
	itemAs?: import("react").ElementType;
	enableKeyboardControl?: boolean;
	autoloadFeatureSource?: boolean;
};

export type SelectFeatureActionOptions = {
	keyboard?: boolean;
};
