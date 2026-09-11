import type Feature from "ol/Feature.js";
import type BaseLayer from "ol/layer/Base.js";
import type {StyleFunction, StyleLike} from "ol/style/Style.js";

export const DEFAULT_USER_AGENT =
	"MapsightOlBitmap/1.0 (+https://github.com/open-mapsight/mapsight)";

export type LonLat = [number, number];

export type ViewSpec = {
	center: LonLat;
	/**
	 * CRS of `center`. Lon/lat when omitted or `EPSG:4326`.
	 * Use `EPSG:3857` for Web Mercator metres.
	 */
	projection?: string;
	resolution?: number;
	zoom?: number;
};

export type GeoJsonFeatureCollection = {
	features: unknown[];
	type: "FeatureCollection";
};

export type VectorFeatures = Feature[] | GeoJsonFeatureCollection;

export type XyzLayerSpec = {
	attributions?: string | string[];
	crossOrigin?: null | string;
	type: "xyz";
	url: string;
};

export type VectorLayerSpec = {
	declutter?: boolean;
	features?: VectorFeatures;
	/** Defaults to `"vector"`. Used with {@link MapBitmapRenderer.setVectorFeatures}. */
	key?: string;
	style: StyleFunction | StyleLike;
	type: "vector";
};

export type OlLayerSpec = {
	layer: BaseLayer;
	type: "layer";
};

export type LayerSpec = OlLayerSpec | VectorLayerSpec | XyzLayerSpec;

export type CreateMapBitmapRendererOptions = {
	height: number;
	layers: LayerSpec[];
	pixelRatio?: number;
	timeoutMs?: number;
	userAgent?: string;
	view: ViewSpec;
	width: number;
};

export type RenderPngOptions = CreateMapBitmapRendererOptions;

export type MapBitmap = {
	buffer: Buffer;
	elapsedMs: number;
	height: number;
	mimeType: "image/png";
	width: number;
};

export type MapBitmapRenderer = {
	dispose: () => void;
	render: (view?: Partial<ViewSpec>) => Promise<MapBitmap>;
	setVectorFeatures: (features: VectorFeatures, key?: string) => void;
};
