import type {MapsightStyleFunction} from "@mapsight/lib-ol/style/styleFunction";

import {createHubPartialChangeHandler} from "../helpers/global-event-hub";
import createDefaultPlugins from "../plugins/browser-defaults";
import createPartialContentChangedEventPlugin from "../plugins/browser/partial-content-changed-event";
import type {
	CreateOptions,
	MapsightUiContext,
	PluginDefinition,
} from "../types";

export type DefaultPluginsOptions = Parameters<typeof createDefaultPlugins>[0];

/**
 * Historic embed option fields still used by pre-OSS host apps.
 *
 * @deprecated Prefer {@link CreateOptions}. Removed in the next major of
 *   `@mapsight/ui`.
 */
export type LegacyEmbedOptions = Omit<
	CreateOptions,
	"useDefaultPlugins" | "defaultPluginsOptions"
> & {
	/** @deprecated Prefer `useDefaultPlugins` */
	defaultPluginsOptions?: DefaultPluginsOptions;
	/**
	 * When `true` or an options object, prepend {@link createDefaultPlugins}.
	 * Implied when `defaultPluginsOptions` is set.
	 */
	useDefaultPlugins?: boolean | DefaultPluginsOptions;
};

/**
 * Flat options for {@link browserEmbed} (current API).
 */
export type BrowserEmbedOptions = {
	styleFunction: MapsightStyleFunction;
	baseMapsightConfig?: object;
	createOptions?: CreateOptions;
};

/**
 * Legacy config bag built by {@link createEmbedBag}. Hosts often mutate
 * `baseMapsightCoreConfig` / `embedOptions` after the factory returns.
 *
 * @deprecated Prefer {@link BrowserEmbedOptions}. Removed in the next major of
 *   `@mapsight/ui`.
 */
export type LegacyEmbedBag = {
	styleFunction: MapsightStyleFunction;
	baseMapsightCoreConfig: object;
	preset: object;
	embedUiState: object;
	embedOptions: LegacyEmbedOptions;
	/** Mirror of `baseMapsightCoreConfig` (may be stale if the host reassigns the legacy field). */
	baseMapsightConfig: object;
	/** Snapshot of embed options; prefer live `embedOptions` when present. */
	createOptions: CreateOptions;
};

export type BrowserEmbedInput = BrowserEmbedOptions | LegacyEmbedBag;

/**
 * Normalize current or legacy embed input into the flat browserEmbed shape.
 *
 * Prefer live legacy fields (`baseMapsightCoreConfig`, `embedOptions`) so hosts
 * that mutate the bag after {@link createEmbedBag} keep working.
 *
 * @deprecated Legacy-bag normalization only. Prefer passing
 *   {@link BrowserEmbedOptions} directly. Removed in the next major of
 *   `@mapsight/ui`.
 */
export function normalizeBrowserEmbedOptions(
	options: BrowserEmbedInput,
): BrowserEmbedOptions {
	const styleFunction = options.styleFunction;
	const baseMapsightConfig =
		("baseMapsightCoreConfig" in options &&
			options.baseMapsightCoreConfig) ||
		options.baseMapsightConfig ||
		{};

	const embedOptions =
		"embedOptions" in options ? options.embedOptions : undefined;
	const createOptionsInput = options.createOptions;
	const embedUiState =
		"embedUiState" in options ? options.embedUiState : undefined;

	const raw: LegacyEmbedOptions = embedOptions
		? {
				...embedOptions,
				uiState: {
					...(createOptionsInput?.uiState || {}),
					...(embedOptions.uiState || {}),
					...(embedUiState || {}),
				},
			}
		: {
				...(createOptionsInput || {}),
				...(embedUiState
					? {
							uiState: {
								...(createOptionsInput?.uiState || {}),
								...embedUiState,
							},
						}
					: {}),
			};

	const {
		defaultPluginsOptions,
		useDefaultPlugins,
		hook,
		plugins: extraPlugins = [],
		partialChangeHandler,
		...rest
	} = raw;

	const shouldUseDefaults =
		useDefaultPlugins === true ||
		typeof useDefaultPlugins === "object" ||
		defaultPluginsOptions != null;

	const defaultOpts: DefaultPluginsOptions =
		typeof useDefaultPlugins === "object"
			? useDefaultPlugins
			: defaultPluginsOptions || {};

	const plugins: PluginDefinition[] = [
		...(shouldUseDefaults ? createDefaultPlugins(defaultOpts) : []),
		// Always register when defaults are used so `partialChangeHandler` works.
		...(shouldUseDefaults
			? [
					[
						"partialContentChangedEvent",
						createPartialContentChangedEventPlugin(),
					] satisfies PluginDefinition,
				]
			: []),
		...extraPlugins,
		...(typeof hook === "function"
			? [
					[
						"legacyEmbedHook",
						{
							afterCreate(context: MapsightUiContext) {
								hook(context);
							},
						},
					] satisfies PluginDefinition,
				]
			: []),
	];

	// Only auto-bridge the process hub for historic bags that still mutate
	// `embedOptions` / `baseMapsightCoreConfig`. Modern hosts should set
	// `partialChangeHandler` explicitly (or subscribe via AppChannel).
	const shouldBridgeHub =
		partialChangeHandler == null &&
		shouldUseDefaults &&
		("embedOptions" in options || "baseMapsightCoreConfig" in options);
	const resolvedPartialChangeHandler =
		partialChangeHandler ??
		(shouldBridgeHub ? createHubPartialChangeHandler() : undefined);

	return {
		styleFunction,
		baseMapsightConfig,
		createOptions: {
			...rest,
			plugins,
			...(resolvedPartialChangeHandler
				? {partialChangeHandler: resolvedPartialChangeHandler}
				: {}),
		},
	};
}

/**
 * Convert a legacy bag to flat {@link BrowserEmbedOptions}.
 *
 * @deprecated Prefer constructing {@link BrowserEmbedOptions} directly.
 *   Removed in the next major of `@mapsight/ui`.
 */
export function legacyBagToBrowserEmbedOptions(
	bag: LegacyEmbedBag,
): BrowserEmbedOptions {
	return normalizeBrowserEmbedOptions(bag);
}
