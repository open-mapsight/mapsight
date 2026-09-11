/**
 * Default SSR render module (contract stub).
 *
 * Hosts mount their product bundle on /host and set
 * MAPSIGHT_SSR_MODULE=/host/render.js — same Node 24 container.
 *
 * Expected POST JSON:
 *   { v?: 1, preset, options: { containerId, containerClassName?, … } }
 *
 * `render()` returns an HTML fragment with data-dehydrated-state.
 * `renderEnvelope()` is the same fragment plus pageMeta (null in this stub).
 * `/v1/render` also accepts `{ html, state }` from the module.
 */

export type SsrRequestBody = {
	v?: 1;
	preset?: string;
	requestId?: string;
	assetVersion?: string;
	options?: {
		containerId?: string;
		containerClassName?: string;
		dehydratedState?: unknown;
		requestUrl?: string;
		pageOrigin?: string;
		ogImage?: string;
		[key: string]: unknown;
	};
};

export type PlacePageMeta = {
	title: string;
	description: string;
	canonicalUrl: string;
	og: {
		title: string;
		description: string;
		url: string;
		type: "place" | "website";
		image: string;
	};
	jsonLd: Record<string, unknown>;
};

export type SsrEnvelope = {
	html: string;
	pageMeta: PlacePageMeta | null;
};

export function render(body: SsrRequestBody): string {
	const options = body?.options ?? {};
	const containerId = options.containerId;
	if (typeof containerId !== "string" || containerId === "") {
		const err = new Error("options.containerId is required") as Error & {
			statusCode?: number;
		};
		err.statusCode = 400;
		throw err;
	}

	const className =
		typeof options.containerClassName === "string" &&
		options.containerClassName !== ""
			? options.containerClassName
			: "mapsight-embed";

	const dehydratedState =
		options.dehydratedState && typeof options.dehydratedState === "object"
			? options.dehydratedState
			: {
					app: {
						ssr: "stub",
						preset: body?.preset ?? null,
					},
				};

	const stateJson = JSON.stringify(dehydratedState);

	return `<div id="${escapeAttr(containerId)}" class="${escapeAttr(className)}" data-dehydrated-state="${escapeAttr(stateJson)}"></div>`;
}

/** Same fragment as render(), plus pageMeta. Stub has no feature lookup. */
export function renderEnvelope(body: SsrRequestBody): Promise<SsrEnvelope> {
	return Promise.resolve({html: render(body), pageMeta: null});
}

/** Product module clears xhr-json documents. Stub has no process cache. */
export function purge(_urls?: string[]): Promise<string[]> {
	return Promise.resolve([]);
}

function escapeAttr(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/"/g, "&quot;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
}
