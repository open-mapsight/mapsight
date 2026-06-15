import {applyMiddleware, compose} from "@reduxjs/toolkit";
import merge from "lodash/merge";
import {thunk} from "redux-thunk";

import {createMapsightStore} from "@mapsight/core";
import {isDevelopment} from "@mapsight/core/lib/helpers";
import {layerIdsExternalSwitcherSelector} from "@mapsight/core/lib/map/selectors";

import * as nonNull from "@mapsight/lib-js/nonNullable";
import type {MapsightStyleFunction} from "@mapsight/lib-ol/style/styleFunction";

import {siteConfig} from "./config";
import {VIEW_MOBILE} from "./config/constants/app";
import * as c from "./config/constants/controllers";
import type {MapsightConfig} from "./config/schema";
import {validateMapsightConfig} from "./config/schema/validate";
import {createDefaultControllers} from "./controllers/defaults";
import uiReducers from "./store/reducers";
import type {
	CreateOptions,
	MapsightUiContext,
	MapsightUiRenderer,
	MapsightUiRendererProps,
	MapsightUiStore,
	PluginDefinition,
	PluginPhase,
} from "./types";

/**
 * Default mapsight ui renderer (Does nothing but log a warning!).
 */
const defaultRenderer: MapsightUiRenderer<void> = (
	_container,
	_props,
	_hydrate = false,
) => {
	console.info("create has to be passed a renderer to render the app");
};

// FIXME: What's the point in having this if it's all undefined?
const defaultCreateOptions: CreateOptions = {
	baseUrl: undefined,
	imagesUrl: undefined,
	// search
	searchUrl: undefined,
	searchQueryParameter: undefined,
	reHydratedState: undefined,
	uiState: {
		isFullscreen: false,
		listQuery: "",
		listSorting: undefined,
		listPage: 0, // current page
		searchQuery: "",
		searchResult: {},
		searchResultSelectionFeatures: [],
		title: "",
		userPreferenceListVisible: true,
		mapIsOutOfViewport: false,

		// views
		view: VIEW_MOBILE, // mobile first
		viewBreakpoints: [],

		embeddedMap: false, // map is embedded which switch some behaviours which would be annoying
		searchInMap: true, // enable address search in map overlay

		pageTitle: {
			show: true, // show page title
		},
		tagSwitcher: {
			show: false, // turn on tag switcher which will filter
			featureSourceId: undefined,
			featureSourcesControllerName: c.FEATURE_SOURCES,
			toggleableGroups: false, // make group names (headers) buttons that toggle on/off groups
			sortTags: false, // sort tags with locale sort, but not the tagGroups. to sort tagGroups add all tagGroups to first feature entry (but with empty tags if the entry doesn't have tags for a tagGroup)
		},
		viewToggle: {
			show: true,
			deselectFeaturesOnToggle: true,
		},
		layerSwitcher: {
			show: {
				internal: true,
				external: false,
			},
			internal: {
				layerIdsSelector: undefined, // implied default: layer ids of layers viewed in internal Selector
				grouped: false,
				splitBaseLayers: false,
			},
			external: {
				// FIXME: function in redux state?
				layerIdsSelector: layerIdsExternalSwitcherSelector,
				grouped: true,
				splitBaseLayers: false,
			},
		},
		list: {
			selectionBehavior: {
				desktop: "scrollToMap", // always 'scrollToMap' for now
				mobile: "expandInList", // either 'expandInList', 'scrollToMap', 'showInMapOnlyView'
			},
			detailsInList: false, // if true details will always be shown in list even if not on mobile
			showSelectedOnly: false, // don't show list entries, only show the selected one (need some other kind of communication, cyclingControl or icons on the map)
			highlightOnMouse: true, // highlights list item on mouse enter (and un-highlights on leave)
			selectOnClick: true, // select on click to selected list item
			deselectOnClick: false, // deselect on click to selected list item
			cyclingControl: false, // show a control to select next or previous list entry
			sortControl: true, // show sort control icon
			layerSwitcherControl: false, // show layer switcher as collapsible control in integrated list header
			tagSwitcherControl: false, // show tag switcher as collapsible control in integrated list header
			filterControl: true, // show filter box
			paginationControl: false, // show pagination
			itemsPerPage: 10, // number of items per page
			stickyHeader: true, // make list header sticky?
			showVaryingListInfoOnly: true, // show info column only, if the contents vary (determined before list filter)
		},
		featureSelectionInfo: {
			stickyHeader: false, // make feature selection info header sticky?
			stuckHeaderHeight: 30, // px
		},
		regions: {},
		places: {},
	},

	plugins: [],
	renderer: defaultRenderer,
	components: {},
	renderBreakpoints: {
		// NOTE: Keep in sync with css!
		mobile: [0, 767],
		tablet: [768, 1014],
		desktop: [1015, -1],
	},
	partialChangeHandler: undefined,

	// add additional reducers
	reducers: {...uiReducers},
};

/**
 * Creates an mapsight ui instance
 *
 * @param container element the mapsight ui app should be rendered into
 * @param styleFunction the mapsight core vector style function (see @mapsight/core)
 * @param [baseMapsightConfig] base mapsight configuration TODO: document further
 * @param [createOptions] ui creation options TODO: document further
 * @returns mapsight ui instance
 */
export function create(
	container: HTMLElement | null,
	styleFunction: MapsightStyleFunction,
	baseMapsightConfig: Partial<MapsightConfig> = {},
	createOptions: CreateOptions = {},
): MapsightUiContext {
	const mergedCreateOptions = merge({}, defaultCreateOptions, createOptions);
	const shouldValidate =
		mergedCreateOptions.validateConfig ?? isDevelopment();
	const validatedBaseMapsightConfig = shouldValidate
		? validateMapsightConfig(baseMapsightConfig, {
				context: "create()",
			})
		: baseMapsightConfig;

	const context: MapsightUiContext = {
		hasRendered: false,
		container: container,
		styleFunction: styleFunction,
		baseMapsightConfig: validatedBaseMapsightConfig,
		createOptions: mergedCreateOptions,
		appChannelListeners: [],
	};

	// transfer some create options to global site config to make them available even outside of the redux context
	// TODO: Replace this mechanic with an explicit API, e.g. exposing the site config directly as `@mapsight/ui/site-config` or
	//    make them local to the mapsight ui context to allow for several independent instances with different site configs
	siteConfig.baseUrl = context.createOptions.baseUrl ?? siteConfig.baseUrl;
	siteConfig.imagesUrl =
		context.createOptions.imagesUrl || siteConfig.imagesUrl;
	siteConfig.searchUrl =
		context.createOptions.searchUrl || siteConfig.searchUrl;
	siteConfig.searchQueryParameter =
		context.createOptions.searchQueryParameter ||
		siteConfig.searchQueryParameter;

	// initial state
	context.initialState = merge({}, context.baseMapsightConfig, {
		app: context.createOptions.uiState,
	});
	delete context.createOptions.uiState;

	// override initial state by re-hydration
	context.isStateReHydrated = false;
	if (context.createOptions.reHydratedState !== undefined) {
		context.isStateReHydrated = true;
		merge(context.initialState, context.createOptions.reHydratedState);
	}

	// setup controllers
	context.controllers = Object.assign(
		createDefaultControllers(context),
		context.createOptions.controllers,
	);

	// store enhancer
	const uiStoreEnhancer = applyMiddleware(thunk);
	// @ts-expect-error TODO
	context.storeEnhancer = context.createOptions.storeEnhancer
		? compose(uiStoreEnhancer, context.createOptions.storeEnhancer)
		: uiStoreEnhancer;

	// plugin: afterInit
	callAndForgetPlugins(context, "afterInit");

	context.store = createMapsightStore<MapsightUiStore>(
		context.controllers,
		Object.fromEntries(
			Object.entries(context.createOptions.reducers ?? {})
				.map(([name, reducer]) =>
					nonNull.map(reducer, (reducer) => [name, reducer] as const),
				)
				.filter(nonNull.is),
		),
		context.initialState,
		context.storeEnhancer,
	);

	// render
	function internalRender(): unknown {
		const hydrate = !context.hasRendered && context.isStateReHydrated;
		nonNull.assert(context.store);
		nonNull.assert(context.createOptions.renderer);

		const props: MapsightUiRendererProps = {
			store: context.store,
			components: context.createOptions.components || {},
			appChannelListeners: context.appChannelListeners,
			...context.rendererProps,
		};
		context.renderRef = context.createOptions.renderer(
			context.container,
			props,
			hydrate,
		);
		context.hasRendered = true;

		callAndForgetPlugins(context, "afterRender");

		return context.renderRef;
	}

	// Render without waiting for plugins (for e.g. waiting on external data)
	context.render = function mapsightUiRender(rendererProps) {
		context.rendererProps = rendererProps;
		context.canPluginsDelayRender = false;

		callAndForgetPlugins(context, "beforeRender");

		return internalRender();
	};

	// Render allowing plugins to delay render (for e.g. waiting on external data)
	context.renderAsync = async function mapsightUiRenderAsync(rendererProps) {
		context.rendererProps = rendererProps;
		context.canPluginsDelayRender = true;

		await callAndAwaitPlugins(context, "beforeRender");

		return internalRender();
	};

	// plugin: afterCreate
	callAndForgetPlugins(context, "afterCreate");

	return context;
}

/**
 * Overrides plugins with the same name (last to come wins), null unsets the plugin,
 * Flattened order is in order of first occurrence of a name.
 *
 * @param plugins (sorted) array of plugin definitions to be flattened, null unsets
 * @returns flattened plugin definitions
 */
function flattenPlugins(plugins: Array<PluginDefinition>) {
	const pluginPositionByName: Record<string, number> = {};
	const flattenedPlugins: Array<PluginDefinition> = [];

	plugins.forEach(function filterPlugin(plugin) {
		const [key] = plugin;
		const position = pluginPositionByName[key];
		if (position !== undefined) {
			flattenedPlugins.splice(position, 1, plugin);
		} else {
			pluginPositionByName[key] = flattenedPlugins.length;
			flattenedPlugins.push(plugin);
		}
	});

	return flattenedPlugins.filter(([_, plugin]) => !!plugin);
}

/**
 * @param context context in which the plugin will be called
 * @param phase phase of the plugin
 * @returns array of plugin call return values
 */
function callPlugins(
	context: MapsightUiContext,
	phase: PluginPhase,
): Array<Promise<unknown>> {
	return flattenPlugins(context.createOptions?.plugins ?? [])
		.map(([_name, plugin]) => plugin?.[phase]?.(context) ?? undefined)
		.filter(nonNull.is);
}

/**
@param context context in which the plugin will be called
@param phase phase of the plugin
 */
function callAndForgetPlugins(context: MapsightUiContext, phase: PluginPhase) {
	Promise.allSettled(callPlugins(context, phase)).catch(() => {});
}

/**
 * @param context context in which the plugin will be called
 * @param phase phase of the plugin
 * @returns promise that all plugins are resolved
 */
async function callAndAwaitPlugins(
	context: MapsightUiContext,
	phase: PluginPhase,
): Promise<void> {
	await Promise.all(callPlugins(context, phase));
}
