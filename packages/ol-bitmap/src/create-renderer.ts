import type Feature from "ol/Feature.js";
import OlMap from "ol/Map.js";
import View from "ol/View.js";
import GeoJSON from "ol/format/GeoJSON.js";
import {WORKER_OFFSCREEN_CANVAS} from "ol/has.js";
import TileLayer from "ol/layer/Tile.js";
import VectorLayer from "ol/layer/Vector.js";
import {fromLonLat} from "ol/proj.js";
import VectorSource from "ol/source/Vector.js";
import XYZ from "ol/source/XYZ.js";

import {OffscreenCanvas} from "./install-ol-node-env.ts";
import {createXyzTileLoadFunction} from "./tile-load.ts";
import {
	type CreateMapBitmapRendererOptions,
	DEFAULT_USER_AGENT,
	type GeoJsonFeatureCollection,
	type MapBitmap,
	type MapBitmapRenderer,
	type VectorFeatures,
	type ViewSpec,
} from "./types.ts";

const DEFAULT_TIMEOUT_MS = 20_000;
const VIEW_PROJECTION = "EPSG:3857";

function assertSize(width: number, height: number): void {
	if (
		!Number.isInteger(width) ||
		!Number.isInteger(height) ||
		width <= 0 ||
		height <= 0
	) {
		throw new Error(
			`@mapsight/ol-bitmap: width and height must be positive integers (got ${width}×${height})`,
		);
	}
}

function resolveCenter(view: ViewSpec): [number, number] {
	if (view.projection === "EPSG:3857") {
		return view.center;
	}
	return fromLonLat(view.center, VIEW_PROJECTION) as [number, number];
}

function applyView(olView: View, spec: ViewSpec | Partial<ViewSpec>): void {
	if (spec.center) {
		olView.setCenter(resolveCenter(spec as ViewSpec));
	}
	if (spec.zoom !== undefined) {
		olView.setZoom(spec.zoom);
	}
	if (spec.resolution !== undefined) {
		olView.setResolution(spec.resolution);
	}
}

function isFeatureCollection(
	features: VectorFeatures,
): features is GeoJsonFeatureCollection {
	return (
		!Array.isArray(features) &&
		features !== null &&
		typeof features === "object" &&
		features.type === "FeatureCollection"
	);
}

function readFeatures(features: VectorFeatures): Feature[] {
	if (isFeatureCollection(features)) {
		return new GeoJSON().readFeatures(features, {
			dataProjection: "EPSG:4326",
			featureProjection: VIEW_PROJECTION,
		});
	}
	return features;
}

function waitForRender(map: OlMap, timeoutMs: number): Promise<void> {
	return new Promise((resolve, reject) => {
		const timeout = setTimeout(() => {
			reject(
				new Error(
					`@mapsight/ol-bitmap: rendercomplete timed out after ${timeoutMs}ms`,
				),
			);
		}, timeoutMs);
		map.once("rendercomplete", () => {
			clearTimeout(timeout);
			resolve();
		});
		map.render();
	});
}

export function createMapBitmapRenderer(
	options: CreateMapBitmapRendererOptions,
): Promise<MapBitmapRenderer> {
	try {
		return Promise.resolve(createMapBitmapRendererSync(options));
	} catch (error) {
		return Promise.reject(
			error instanceof Error ? error : new Error(String(error)),
		);
	}
}

function createMapBitmapRendererSync(
	options: CreateMapBitmapRendererOptions,
): MapBitmapRenderer {
	if (!WORKER_OFFSCREEN_CANVAS) {
		throw new Error(
			"@mapsight/ol-bitmap must be imported before `ol` in this process so the worker/OffscreenCanvas path is active.",
		);
	}

	assertSize(options.width, options.height);
	if (!options.view.center) {
		throw new Error("@mapsight/ol-bitmap: view.center is required");
	}
	if (
		options.view.zoom === undefined &&
		options.view.resolution === undefined
	) {
		throw new Error(
			"@mapsight/ol-bitmap: view.zoom or view.resolution is required",
		);
	}

	const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
	const userAgent = options.userAgent ?? DEFAULT_USER_AGENT;
	const canvas = new OffscreenCanvas(options.width, options.height);
	const vectorSources = new Map<string, VectorSource>();
	let unnamedVectorCount = 0;

	const layers = options.layers.map((spec) => {
		if (spec.type === "layer") {
			return spec.layer;
		}
		if (spec.type === "xyz") {
			return new TileLayer({
				source: new XYZ({
					url: spec.url,
					attributions: spec.attributions,
					crossOrigin: spec.crossOrigin ?? "anonymous",
					transition: 0,
					tileLoadFunction: createXyzTileLoadFunction(userAgent),
				}),
			});
		}
		const key =
			spec.key ??
			(unnamedVectorCount === 0
				? "vector"
				: `vector-${unnamedVectorCount}`);
		unnamedVectorCount += 1;
		const source = new VectorSource({
			features: spec.features ? readFeatures(spec.features) : [],
		});
		vectorSources.set(key, source);
		return new VectorLayer({
			source,
			style: spec.style,
			declutter: spec.declutter,
		});
	});

	const map = new OlMap({
		target: canvas as unknown as HTMLCanvasElement,
		controls: [],
		interactions: [],
		layers,
		pixelRatio: options.pixelRatio ?? 1,
		view: new View({
			center: resolveCenter(options.view),
			projection: VIEW_PROJECTION,
			zoom: options.view.zoom,
			resolution: options.view.resolution,
		}),
	});

	let disposed = false;

	function assertOpen(): void {
		if (disposed) {
			throw new Error("@mapsight/ol-bitmap: renderer has been disposed");
		}
	}

	return {
		async render(view) {
			assertOpen();
			if (view) {
				applyView(map.getView(), view);
			}
			const started = performance.now();
			await waitForRender(map, timeoutMs);
			const buffer = Buffer.from(await canvas.encode("png"));
			return {
				buffer,
				elapsedMs: performance.now() - started,
				height: canvas.height,
				mimeType: "image/png",
				width: canvas.width,
			} satisfies MapBitmap;
		},
		setVectorFeatures(features, key = "vector") {
			assertOpen();
			const source = vectorSources.get(key);
			if (!source) {
				throw new Error(
					`@mapsight/ol-bitmap: no vector layer with key "${key}"`,
				);
			}
			source.clear();
			source.addFeatures(readFeatures(features));
		},
		dispose() {
			if (disposed) {
				return;
			}
			disposed = true;
			map.setTarget(undefined);
			map.dispose();
		},
	};
}
