import type {MapsightStyleFunction} from "@mapsight/lib-ol/style/styleFunction";

import type {
	LegacyEmbedBag,
	LegacyEmbedOptions,
} from "./normalize-legacy-options";

export type {
	BrowserEmbedInput,
	BrowserEmbedOptions,
	DefaultPluginsOptions,
	LegacyEmbedBag,
	LegacyEmbedOptions,
} from "./normalize-legacy-options";
export {
	legacyBagToBrowserEmbedOptions,
	normalizeBrowserEmbedOptions,
} from "./normalize-legacy-options";

/**
 * Historic `@mapsight/ui/embed` config-bag factory.
 *
 * Builds a bag with legacy field names (`baseMapsightCoreConfig`, `embedOptions`,
 * …) that hosts can mutate, then pass to {@link browserEmbed}. Prefer flat
 * `{ styleFunction, baseMapsightConfig, createOptions }` for new hosts.
 *
 * @see docs/integration/UPGRADE_FROM_LEGACY_EMBED.md
 */
export function createEmbedBag(
	styleFunction: MapsightStyleFunction,
	baseMapsightCoreConfig: object = {},
	preset: object = {},
	embedUiState: object = {},
	embedOptions: LegacyEmbedOptions = {},
): LegacyEmbedBag {
	const bag: LegacyEmbedBag = {
		styleFunction,
		baseMapsightCoreConfig,
		preset,
		embedUiState,
		embedOptions,
		// Mirrors for hosts / tooling that already read the modern names.
		// `browserEmbed` prefers the live legacy fields when present.
		baseMapsightConfig: baseMapsightCoreConfig,
		createOptions: {
			...embedOptions,
			uiState: embedUiState,
		},
	};
	return bag;
}

/** @deprecated Use {@link createEmbedBag} */
export default createEmbedBag;
