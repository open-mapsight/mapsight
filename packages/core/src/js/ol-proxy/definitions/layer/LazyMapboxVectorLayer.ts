import BaseEvent from "ol/events/Event";
import EventType from "ol/events/EventType";
import MVT from "ol/format/MVT";
import VectorTileLayer from "ol/layer/VectorTile";
import VectorTileSource from "ol/source/VectorTile";

import {applyBackground, applyStyle} from "ol-mapbox-style";

import {
	type MapboxStyleDocument,
	type MapboxStyleTransform,
	applyMapboxStyleTransforms,
	validateMapboxStyleTransforms,
} from "./mapboxStyleTransforms";

export type LazyMapboxVectorLayerOptions = {
	styleUrl: string;
	/**
	 * `setLayerProperties` transforms applied to the style document in the
	 * browser. Plain JSON only, validated more strictly than by the tile-proxy
	 * (see `docs/integration/TILE_PROXY.md`). When non-empty, the layer fetches
	 * `styleUrl` itself (http(s) or relative URLs only); relative sprite and
	 * source URLs inside the style still resolve against `styleUrl`.
	 */
	styleTransforms?: MapboxStyleTransform[];
	accessToken?: string;
	/** CSS URL template; style metadata `ol:webfonts` takes precedence. */
	webfonts?: string;
	source?: string;
	layers?: string[];
	background?: unknown;
	declutter?: boolean;
	extent?: number[];
	className?: string;
	opacity?: number;
	visible?: boolean;
	zIndex?: number;
	minResolution?: number;
	maxResolution?: number;
	minZoom?: number;
	maxZoom?: number;
	renderOrder?: unknown;
	renderBuffer?: number;
	renderMode?: "hybrid" | "vector";
	map?: unknown;
	updateWhileAnimating?: boolean;
	updateWhileInteracting?: boolean;
	preload?: number;
	useInterimTilesOnError?: boolean;
	properties?: Record<string, unknown>;
};

async function loadStyleDocument(
	url: URL,
	signal: AbortSignal,
): Promise<MapboxStyleDocument> {
	const response = await fetch(url, {
		headers: {Accept: "application/json"},
		signal,
	});
	if (!response.ok) {
		throw new Error(
			`Error fetching style ${url.href}: HTTP ${response.status}`,
		);
	}

	return (await response.json()) as MapboxStyleDocument;
}

type PendingStyleRequest = {
	document: Promise<MapboxStyleDocument>;
	controller: AbortController;
	/** Layers that still wait for the document. */
	waiting: number;
};

/**
 * Raw style documents being fetched, by resolved URL. Entries only live while
 * the request is pending, so there is no cache between loads.
 */
const pendingStyleRequests = new Map<string, PendingStyleRequest>();

/**
 * Fetches the raw style document. Layers with the same style URL share one
 * request; the shared document must not be modified. The request is only
 * aborted when every layer waiting for it aborted.
 */
function fetchStyleDocument(
	styleUrl: string,
	signal: AbortSignal,
): Promise<MapboxStyleDocument> {
	const url = new URL(styleUrl, globalThis.location?.href);
	if (url.protocol !== "http:" && url.protocol !== "https:") {
		throw new Error(
			`styleTransforms require an http(s) or relative styleUrl, got "${styleUrl}"`,
		);
	}
	signal.throwIfAborted();

	let request = pendingStyleRequests.get(url.href);
	if (!request) {
		const controller = new AbortController();
		const created: PendingStyleRequest = {
			controller,
			waiting: 0,
			document: loadStyleDocument(url, controller.signal).finally(() => {
				if (pendingStyleRequests.get(url.href) === created) {
					pendingStyleRequests.delete(url.href);
				}
			}),
		};
		pendingStyleRequests.set(url.href, created);
		request = created;
	}

	const shared = request;
	shared.waiting++;
	return new Promise((resolve, reject) => {
		const onAbort = () => {
			if (--shared.waiting === 0) {
				shared.controller.abort();
				if (pendingStyleRequests.get(url.href) === shared) {
					pendingStyleRequests.delete(url.href);
				}
			}
			reject(signal.reason as Error);
		};
		signal.addEventListener("abort", onAbort, {once: true});
		void shared.document
			.then(resolve, reject)
			.finally(() => signal.removeEventListener("abort", onAbort));
	});
}

class StyleLoadErrorEvent extends BaseEvent {
	error: unknown;

	constructor(error: unknown) {
		super(EventType.ERROR);
		this.error = error;
	}
}

/**
 * Defers Mapbox style JSON loading until the layer is first shown. The upstream
 * MapboxVectorLayer always fetches styleUrl in its constructor.
 */
export default class LazyMapboxVectorLayer extends VectorTileLayer {
	accessToken?: string;

	private styleLoadStarted = false;

	/** Aborted on disposal to cancel the layer's own style request. */
	private readonly abortController = new AbortController();

	private readonly styleOptions: LazyMapboxVectorLayerOptions;

	constructor(options: LazyMapboxVectorLayerOptions) {
		const declutter = options.declutter ?? true;
		const source = new VectorTileSource({
			state: "loading",
			format: new MVT({layerName: "mvt:layer"}),
		});

		super({
			source,
			background:
				options.background === false
					? undefined
					: (options.background as never),
			declutter,
			extent: options.extent,
			className: options.className,
			opacity: options.opacity,
			visible: options.visible,
			zIndex: options.zIndex,
			minResolution: options.minResolution,
			maxResolution: options.maxResolution,
			minZoom: options.minZoom,
			maxZoom: options.maxZoom,
			renderOrder: options.renderOrder as never,
			renderBuffer: options.renderBuffer,
			renderMode: options.renderMode,
			map: options.map as never,
			updateWhileAnimating: options.updateWhileAnimating,
			updateWhileInteracting: options.updateWhileInteracting,
			preload: options.preload,
			useInterimTilesOnError: options.useInterimTilesOnError,
			properties: options.properties,
		});

		if (options.accessToken) {
			this.accessToken = options.accessToken;
		}

		this.styleOptions = options;

		if (options.visible !== false) {
			this.loadStyle();
		}
	}

	override setVisible(visible: boolean): void {
		super.setVisible(visible);
		if (visible) {
			this.loadStyle();
		}
	}

	override setSource(source: Parameters<VectorTileLayer["setSource"]>[0]) {
		// ol-mapbox-style attaches a source when its style load finishes. A
		// disposed layer must not get one back.
		if (this.disposed && source) {
			return;
		}
		super.setSource(source);
	}

	protected override disposeInternal(): void {
		this.abortController.abort();
		super.disposeInternal();
	}

	private loadStyle(): void {
		if (this.styleLoadStarted || this.disposed) {
			return;
		}

		this.styleLoadStarted = true;

		const {
			styleUrl,
			layers,
			source: sourceId,
			background,
			styleTransforms,
		} = this.styleOptions;
		const vectorSource = this.getSource();
		if (!vectorSource) {
			return;
		}

		const wantsBackground =
			this.getBackground() === undefined && background !== false;

		let load: Promise<unknown[]>;
		// Anything but null, undefined or an empty array counts as transforms,
		// so a malformed container is reported instead of being ignored.
		const hasTransforms =
			styleTransforms != null &&
			!(Array.isArray(styleTransforms) && styleTransforms.length === 0);
		if (hasTransforms) {
			// Relative sprite and source URLs resolve against `styleUrl`, so
			// it is passed along with the already transformed document.
			load = Promise.resolve()
				.then(() => {
					validateMapboxStyleTransforms(styleTransforms);
					return fetchStyleDocument(
						styleUrl,
						this.abortController.signal,
					);
				})
				.then((document) => {
					if (this.disposed) {
						return [];
					}
					const style = applyMapboxStyleTransforms(
						document,
						styleTransforms,
					);
					const promises = [
						applyStyle(this, style, layers ?? sourceId, {
							accessToken: this.accessToken,
							webfonts: this.styleOptions.webfonts,
							styleUrl,
						}),
					];
					if (wantsBackground) {
						promises.push(
							applyBackground(this, structuredClone(style), {
								accessToken: this.accessToken,
							}),
						);
					}
					return Promise.all(promises);
				});
		} else {
			const promises = [
				applyStyle(this, styleUrl, layers ?? sourceId, {
					accessToken: this.accessToken,
					webfonts: this.styleOptions.webfonts,
				}),
			];

			if (wantsBackground) {
				promises.push(
					applyBackground(this, styleUrl, {
						accessToken: this.accessToken,
					}),
				);
			}
			load = Promise.all(promises);
		}

		void load
			.then(() => {
				if (!this.disposed) {
					vectorSource.setState("ready");
				}
			})
			.catch((error: unknown) => {
				if (this.disposed) {
					return;
				}
				this.dispatchEvent(new StyleLoadErrorEvent(error));
				vectorSource.setState("error");
			});
	}
}
