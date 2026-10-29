import createDefaultPlugins from "../plugins/browser-defaults";
import createPartialContentChangedEventPlugin from "../plugins/browser/partial-content-changed-event";
import type {CreateOptions, PluginDefinition} from "../types";

/** Expand the browser-only default-plugin convenience option. */
export function prepareBrowserCreateOptions({
	useDefaultPlugins,
	plugins = [],
	...options
}: CreateOptions): CreateOptions {
	const useDefaults =
		useDefaultPlugins === true || typeof useDefaultPlugins === "object";
	return {
		...options,
		plugins: [
			...(useDefaults
				? [
						...createDefaultPlugins(
							typeof useDefaultPlugins === "object"
								? useDefaultPlugins
								: {},
						),
						[
							"partialContentChangedEvent",
							createPartialContentChangedEventPlugin(),
						] satisfies PluginDefinition,
					]
				: []),
			...plugins,
		],
	};
}
