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
} from "./mapboxStyleTransforms";

export type LazyMapboxVectorLayerOptions = {
	styleUrl: string;
	/**
	 * `setLayerProperties` transforms applied to the style document in the
	 * browser. When non-empty, the layer fetches `styleUrl` itself (http(s) or
	 * relative URLs only); relative URLs inside the style still resolve against
	 * `styleUrl`.
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

async function fetchStyleDocument(
	styleUrl: string,
): Promise<MapboxStyleDocument> {
	const url = new URL(styleUrl, globalThis.location?.href);
	if (url.protocol !== "http:" && url.protocol !== "https:") {
		throw new Error(
			`styleTransforms require an http(s) or relative styleUrl, got "${styleUrl}"`,
		);
	}

	const response = await fetch(url, {headers: {Accept: "application/json"}});
	if (!response.ok) {
		throw new Error(
			`Error fetching style ${url.href}: HTTP ${response.status}`,
		);
	}

	return (await response.json()) as MapboxStyleDocument;
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

	private loadStyle(): void {
		if (this.styleLoadStarted) {
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
		if (styleTransforms?.length) {
			// Relative sprite/glyph/source URLs resolve against `styleUrl`, so
			// it is passed along with the already transformed document.
			load = fetchStyleDocument(styleUrl).then((document) => {
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
				vectorSource.setState("ready");
			})
			.catch((error: unknown) => {
				this.dispatchEvent(new StyleLoadErrorEvent(error));
				vectorSource.setState("error");
			});
	}
}
