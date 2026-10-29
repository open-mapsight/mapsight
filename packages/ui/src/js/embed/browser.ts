import merge from "lodash/merge";

import {create} from "../index";
import browserDomRenderer from "../renderer/browser-dom";
import type {CreateOptions, MapsightUiRenderFunction} from "../types";
import type {BrowserEmbedOptions} from "./index";
import {prepareBrowserCreateOptions} from "./prepare-options";

/**
 * Browser embed
 *
 * Accepts flat `{ styleFunction, baseMapsightConfig, createOptions }` options.
 *
 * @param container the container element to render the app into
 * @param options browser embed options
 * @returns render function
 */
export default function browserEmbed(
	container: HTMLElement,
	options: BrowserEmbedOptions,
): MapsightUiRenderFunction<any> | undefined {
	const {
		styleFunction,
		baseMapsightConfig = {},
		createOptions: inputOptions = {},
	} = options;
	const createOptions = prepareBrowserCreateOptions(inputOptions);

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
	createOptions: CreateOptions,
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
