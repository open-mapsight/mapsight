import type {PluginDefinition} from "../types.ts";
import createFeatureSelectionDetailsUrlPlugin from "./common/feature-selection-details-url.ts";
import createLangPlugin from "./common/lang.ts";
import createOlProxyPlugin from "./common/ol-proxy.ts";
import createFeatureDeepLinkPlugin from "./server/feature-deep-link.ts";

/**
 * Create the default set of plugins for use on the server IN ORDER!
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
	];
}
