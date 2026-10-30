import type {MapsightStyleFunction} from "@mapsight/lib-ol/style/styleFunction";

import {create} from "..";
import serverStringRenderer from "../renderer/server-string";
import type {CreateOptions, MapsightUiStore} from "../types";
import {compactFeatureSourceIndexes} from "./compact-feature-source-indexes";
import {wrapEmbedFragment} from "./emit-fragment";
import {sanitizeRehydratedState} from "./sanitize-rehydrated-state";

export type NodeEmbedOptions = {
	/** style function */
	styleFunction: MapsightStyleFunction;

	/** base mapsight core config */
	baseMapsightConfig: object;

	/** create options */
	createOptions: CreateOptions;

	/** Omit derived feature-source indexes from the wire state; restored on hydrate. */
	compactFeatureSourceIndexes?: boolean;
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
export default function nodeEmbed(options: NodeEmbedOptions): Result {
	const {
		styleFunction,
		baseMapsightConfig = {},
		createOptions = {},
		compactFeatureSourceIndexes: compactIndexes = false,
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
			const wireState = compactIndexes
				? compactFeatureSourceIndexes(state)
				: state;
			const serialized: unknown = JSON.parse(JSON.stringify(wireState));
			return sanitizeRehydratedState(serialized).state;
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
