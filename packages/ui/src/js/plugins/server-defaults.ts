import type {PluginDefinition} from "../types";
import createFeatureSelectionDetailsUrlPlugin from "./common/feature-selection-details-url";
import createLangPlugin from "./common/lang";
import createOlProxyPlugin from "./common/ol-proxy";
import createRenderAwaitFeatureDetailsLoadedPlugin from "./common/render-await-feature-details-loaded";
import createRenderAwaitListFeatureSourcesLoadedPlugin from "./common/render-await-list-feature-sources-loaded";
import createFeatureDeepLinkPlugin from "./server/feature-deep-link";

/**
 * Create the default set of plugins for use on the server IN ORDER!
 *
 * Await plugins only delay when the host calls `renderAsync` (`canPluginsDelayRender`).
 * Sync `render()` leaves them no-ops.
 *
 * @param options options map for default plugins
 * @returns sorted list of plugins
 */
export default function createDefaultPlugins(
	options: {
		olProxy?: Parameters<typeof createOlProxyPlugin>[0];
		featureDeepLink?: Parameters<typeof createFeatureDeepLinkPlugin>[0];
		featureSelectionDetailsUrl?: Parameters<
			typeof createFeatureSelectionDetailsUrlPlugin
		>[0];
		renderAwaitListFeatureSourcesLoaded?: Parameters<
			typeof createRenderAwaitListFeatureSourcesLoadedPlugin
		>[0];
		renderAwaitFeatureDetailsLoaded?: Parameters<
			typeof createRenderAwaitFeatureDetailsLoadedPlugin
		>[0];
	} = {},
): PluginDefinition[] {
	return [
		["lang", createLangPlugin()],
		["olProxy", createOlProxyPlugin(options.olProxy)],
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
			"renderAwaitListFeatureSourcesLoaded",
			createRenderAwaitListFeatureSourcesLoadedPlugin(
				options.renderAwaitListFeatureSourcesLoaded,
			),
		],
		[
			"renderAwaitFeatureDetailsLoaded",
			createRenderAwaitFeatureDetailsLoadedPlugin(
				options.renderAwaitFeatureDetailsLoaded,
			),
		],
	];
}
