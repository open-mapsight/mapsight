import type {MapsightStyleFunction} from "@mapsight/lib-ol/style/styleFunction";

import {create} from "..";
import serverStringRenderer from "../renderer/server-string";
import type {CreateOptions} from "../types";

type Options = {
	/** style function */
	styleFunction: MapsightStyleFunction;

	/** base mapsight core config */
	baseMapsightConfig: object;

	/**create options */
	createOptions: CreateOptions;
};

type Result = {
	store: any;
	// (function(*=): undefined)
	render(...something: Array<any>): void;
	// (function(*=): Promise<undefined>)
	renderAsync(...something: Array<any>): Promise<void>;
};

/**
 * Node embed
 *
 * @returns embed reference
 */
export default function nodeEmbed(options: Options): Result {
	const {
		styleFunction,
		baseMapsightConfig = {},
		createOptions = {},
	} = options;

	createOptions.renderer = createOptions.renderer ?? serverStringRenderer;

	const ctx = create(null, styleFunction, baseMapsightConfig, createOptions);

	function render(renderProps = {}) {
		if (ctx.render) {
			ctx.render(renderProps);
		}
	}

	async function renderAsync(renderProps = {}) {
		if (ctx.renderAsync) {
			await ctx.renderAsync(renderProps);
		}
	}

	// for node we do not render but return an object with
	// references to store and async render function
	return {store: ctx.store, render, renderAsync};
}
