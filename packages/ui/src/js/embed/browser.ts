import merge from "lodash/merge";

import type {MapsightStyleFunction} from "@mapsight/lib-ol/style/styleFunction";

import {create} from "../index";
import browserDomRenderer from "../renderer/browser-dom";
import type {CreateOptions, MapsightUiRenderFunction} from "../types";

type Options = {
	/** style function */
	styleFunction: MapsightStyleFunction;

	/** base mapsight core config */
	baseMapsightConfig: object;

	/**create options */
	createOptions: CreateOptions;
};

/**
 * Browser embed
 *
 * @param container the container element to render the app into
 * @param options
 * @returns render function
 */
export default function browserEmbed(
	container: HTMLElement,
	options: Options,
): MapsightUiRenderFunction<any> | undefined {
	const {
		styleFunction,
		baseMapsightConfig = {},
		createOptions = {},
	} = options;

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
