import type {MapsightStyleFunction} from "@mapsight/lib-ol/style/styleFunction";

import {create} from "..";
import serverStringRenderer from "../renderer/server-string";
import type {CreateOptions, MapsightUiStore} from "../types";
import {wrapEmbedFragment} from "./emit-fragment";

type Options = {
	/** style function */
	styleFunction: MapsightStyleFunction;

	/** base mapsight core config */
	baseMapsightConfig: object;

	/** create options */
	createOptions: CreateOptions;
};

export type NodeEmbedEmitFragmentOptions = {
	id: string;
	className?: string;
	attributeName?: string;
};

type Result = {
	store: MapsightUiStore | undefined;
	render(renderProps?: object): string | undefined;
	renderAsync(renderProps?: object): Promise<string | undefined>;
	getDehydratedState(): unknown;
	emitFragment(options: NodeEmbedEmitFragmentOptions): string;
};

/**
 * Node embed — server-side create + render for dehydrated CMS shells.
 *
 * @returns embed reference with HTML render and fragment emit helpers
 */
export default function nodeEmbed(options: Options): Result {
	const {
		styleFunction,
		baseMapsightConfig = {},
		createOptions = {},
	} = options;

	createOptions.renderer = createOptions.renderer ?? serverStringRenderer;

	const ctx = create(null, styleFunction, baseMapsightConfig, createOptions);
	let lastHtml: string | undefined;

	function captureHtml(value: unknown): string | undefined {
		if (typeof value === "string") {
			lastHtml = value;
			return value;
		}
		return undefined;
	}

	function getDehydratedState(): unknown {
		const state = ctx.store?.getState();
		try {
			return JSON.parse(JSON.stringify(state));
		} catch (cause) {
			throw new Error(
				"mapsight ui: store state is not JSON-serializable for dehydration",
				{cause},
			);
		}
	}

	function render(renderProps = {}): string | undefined {
		return captureHtml(ctx.render?.(renderProps));
	}

	async function renderAsync(renderProps = {}): Promise<string | undefined> {
		return captureHtml(await ctx.renderAsync?.(renderProps));
	}

	function emitFragment(
		fragmentOptions: NodeEmbedEmitFragmentOptions,
	): string {
		const html = lastHtml ?? render({}) ?? "";
		const {
			id,
			className = "mapsight-embed",
			attributeName = createOptions.dehydratedStateAttributeName ??
				"data-dehydrated-state",
		} = fragmentOptions;

		return wrapEmbedFragment({
			id,
			className,
			attributeName,
			html,
			dehydratedState: getDehydratedState(),
		});
	}

	return {
		store: ctx.store,
		render,
		renderAsync,
		getDehydratedState,
		emitFragment,
	};
}
