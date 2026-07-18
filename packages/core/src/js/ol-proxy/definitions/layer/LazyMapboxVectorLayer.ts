import BaseEvent from "ol/events/Event";
import EventType from "ol/events/EventType";
import MVT from "ol/format/MVT";
import VectorTileLayer from "ol/layer/VectorTile";
import VectorTileSource from "ol/source/VectorTile";

import {applyBackground, applyStyle} from "ol-mapbox-style";

export type LazyMapboxVectorLayerOptions = {
	styleUrl: string;
	accessToken?: string;
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
		} = this.styleOptions;
		const vectorSource = this.getSource();
		if (!vectorSource) {
			return;
		}

		const promises = [
			applyStyle(this, styleUrl, layers ?? sourceId, {
				accessToken: this.accessToken,
			}),
		];

		if (this.getBackground() === undefined && background !== false) {
			promises.push(
				applyBackground(this, styleUrl, {
					accessToken: this.accessToken,
				}),
			);
		}

		void Promise.all(promises)
			.then(() => {
				vectorSource.setState("ready");
			})
			.catch((error: unknown) => {
				this.dispatchEvent(new StyleLoadErrorEvent(error));
				vectorSource.setState("error");
			});
	}
}
