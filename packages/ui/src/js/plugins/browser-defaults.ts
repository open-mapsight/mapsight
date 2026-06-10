import {FEATURE_SELECTION_PRESELECT} from "../config/feature/selections";
import type {PluginDefinition} from "../types";
import createAppTitlePlugin from "./browser/app-title";
import createFeatureDeepLinkPlugin from "./browser/feature-deep-link";
import createLocalStoragePlugin from "./browser/local-storage";
import createNoScrollPlugin from "./browser/no-scroll";
import createPiwikTrackFeatureSelectionEventPlugin from "./browser/piwik-track-feature-selection-event";
import createPiwikTrackFullscreenToggleEventPlugin from "./browser/piwik-track-fullscreen-toggle-event";
//import createQuitFullscreenOnRenderPlugin from './browser/quit-fullscreen-on-render';
import createSearchPlugin from "./browser/search";
import createToggleMobileViewsPlugin from "./browser/toggle-mobile-views";
import createUserGeolocationPlugin from "./browser/user-geolocation";
import createViewsPlugin from "./browser/views";
import createFeatureSelectionDetailsUrlPlugin from "./common/feature-selection-details-url";
import createLangPlugin from "./common/lang";
import createOlProxyPlugin from "./common/ol-proxy";
import createRuntimeIconStylePlugin from "./common/runtime-icon-style";

/**
 * Create the default set of plugins for use in the browser IN ORDER!
 *
 * @param options options map for default plugins
 * @returns sorted list of plugins
 */
export default function createDefaultPlugins(
	options: {
		olProxy?: Parameters<typeof createOlProxyPlugin>[0];
		runtimeIconStyle?: Parameters<typeof createRuntimeIconStylePlugin>[0];
		appTitle?: Parameters<typeof createAppTitlePlugin>[0];
		featurePreselectDeepLink?: Parameters<
			typeof createFeatureDeepLinkPlugin
		>[0];
		featureDeepLink?: Parameters<typeof createFeatureDeepLinkPlugin>[0];
		featureSelectionDetailsUrl?: Parameters<
			typeof createFeatureSelectionDetailsUrlPlugin
		>[0];
		localStoragePlugin?: Parameters<typeof createLocalStoragePlugin>[0];
		noScroll?: Parameters<typeof createNoScrollPlugin>[0];
		piwikTrackFeatureSelectionEvent?: Parameters<
			typeof createPiwikTrackFeatureSelectionEventPlugin
		>[0];
		piwikTrackFullscreenToggleEvent?: Parameters<
			typeof createPiwikTrackFullscreenToggleEventPlugin
		>[0];
		search?: Parameters<typeof createSearchPlugin>[0];
		toggleMobileViews?: Parameters<typeof createToggleMobileViewsPlugin>[0];
		userGeolocation?: Parameters<typeof createUserGeolocationPlugin>[0];
		views?: Parameters<typeof createViewsPlugin>[0];
	} = {},
): PluginDefinition[] {
	return [
		["lang", createLangPlugin()],
		["olProxy", createOlProxyPlugin(options.olProxy)],
		[
			"runtimeIconStyle",
			createRuntimeIconStylePlugin(options.runtimeIconStyle),
		],
		["appTitle", createAppTitlePlugin(options.appTitle)],
		[
			"featurePreselectDeepLink",
			createFeatureDeepLinkPlugin({
				getParameter: "preselect",
				featureSelection: FEATURE_SELECTION_PRESELECT,
				clearMissingParameters: ["feature"],
				...(options.featurePreselectDeepLink || {}),
			}),
		],
		[
			"featureDeepLink",
			createFeatureDeepLinkPlugin(options.featureDeepLink),
		],
		[
			"featureSelectionDetailsUrl",
			createFeatureSelectionDetailsUrlPlugin(
				options.featureSelectionDetailsUrl,
			),
		],
		[
			"localStoragePlugin",
			createLocalStoragePlugin(options.localStoragePlugin),
		],
		["noScroll", createNoScrollPlugin(options.noScroll)],
		[
			"piwikTrackFeatureSelectionEvent",
			createPiwikTrackFeatureSelectionEventPlugin(
				options.piwikTrackFeatureSelectionEvent,
			),
		],
		[
			"piwikTrackFullscreenToggleEvent",
			createPiwikTrackFullscreenToggleEventPlugin(
				options.piwikTrackFullscreenToggleEvent,
			),
		],
		["search", createSearchPlugin(options.search)],
		//['quitFullscreenOnRender', createQuitFullscreenOnRenderPlugin(options.quitFullscreenOnRender)],
		[
			"toggleMobileViews",
			createToggleMobileViewsPlugin(options.toggleMobileViews),
		],
		[
			"userGeolocation",
			createUserGeolocationPlugin(options.userGeolocation),
		],
		["views", createViewsPlugin(options.views)],
	];
}
