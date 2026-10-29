import type {MapsightStyleFunction} from "@mapsight/lib-ol/style/styleFunction";

import type createDefaultPlugins from "../plugins/browser-defaults";
import type {CreateOptions} from "../types";

export type DefaultPluginsOptions = Parameters<typeof createDefaultPlugins>[0];

/** Flat options for the browser embed. */
export type BrowserEmbedOptions = {
	styleFunction: MapsightStyleFunction;
	baseMapsightConfig?: object;
	createOptions?: CreateOptions;
};
