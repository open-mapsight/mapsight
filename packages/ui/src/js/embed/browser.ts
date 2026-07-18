import merge from "lodash/merge";

import {create} from "../index";
import browserDomRenderer from "../renderer/browser-dom";
import type {MapsightUiRenderFunction} from "../types";
import type {BrowserEmbedInput} from "./normalize-legacy-options";
import {normalizeBrowserEmbedOptions} from "./normalize-legacy-options";

/**
 * Browser embed
 *
 * Accepts either the current flat options
 * `{ styleFunction, baseMapsightConfig, createOptions }` or a legacy bag from
 * {@link createEmbedBag} (`baseMapsightCoreConfig` / `embedOptions` / `hook` /
 * `defaultPluginsOptions`).
 *
 * @param container the container element to render the app into
 * @param options current or legacy embed options
 * @returns render function
 */
export default function browserEmbed(
	container: HTMLElement,
	options: BrowserEmbedInput,
): MapsightUiRenderFunction<any> | undefined {
	const normalized = normalizeBrowserEmbedOptions(options);
	const {
		styleFunction,
		baseMapsightConfig = {},
		createOptions = {},
	} = normalized;

	const {dehydratedStateAttributeName = "data-dehydrated-state"} =
		createOptions;

	createOptions.renderer = createOptions.renderer || browserDomRenderer;

	if (
		!createOptions.reHydratedState &&
		dehydratedStateAttributeName &&
		container
	) {
		pullDeHydratedStateFromContainer(
			createOptions,
			dehydratedStateAttributeName,
			container,
		);
	}
	createOptions.uiState = merge({}, createOptions.uiState || {});

	const {render} = create(
		container,
		styleFunction,
		baseMapsightConfig,
		createOptions,
	);

	// initial render
	if (render !== undefined) {
		render({});
	}

	return render;
}

function pullDeHydratedStateFromContainer(
	createOptions: NonNullable<
		ReturnType<typeof normalizeBrowserEmbedOptions>["createOptions"]
	>,
	dehydratedStateAttributeName: string,
	container: HTMLElement,
): void {
	const stateJson = container.getAttribute(dehydratedStateAttributeName);
	if (stateJson === null) {
		return;
	}

	try {
		createOptions.reHydratedState = JSON.parse(stateJson);
		container.setAttribute(dehydratedStateAttributeName, "");
	} catch (e) {
		console.error(
			"mapsight ui: error reading dehydrated state from container",
			e,
		);
	}
}
