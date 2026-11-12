import TileRange from "ol/TileRange";
import type {Coordinate} from "ol/coordinate";
import type {Extent} from "ol/extent";
import type {Size} from "ol/size";
import WMTS from "ol/source/WMTS";
import WMTSTileGrid from "ol/tilegrid/WMTS";

import isPlainObject from "lodash/isPlainObject";

import type {Definition, InitialOptionMapMapper} from "@/ol-proxy";

import base from "./TileImageSource";

type Ctor = typeof WMTS;

/**
 * Plain JSON description of a WMTS tile grid (see `ol/tilegrid/WMTS`).
 *
 * `matrixIds` and `resolutions` are required and need the same length; either
 * `origin`, `origins` or `extent` has to be given as well.
 */
export type WMTSTileGridDescription = {
	/** Top left corner of the grid, shared by all matrices. */
	origin?: Coordinate;
	/** Top left corner per matrix (same length as `resolutions`). */
	origins?: Coordinate[];
	/** Resolution (map units per pixel) per matrix. */
	resolutions: number[];
	/** `TileMatrix` identifiers, one per resolution. */
	matrixIds: string[];
	/** Tile size in pixels, shared by all matrices. */
	tileSize?: number | Size;
	/** Tile size per matrix (same length as `resolutions`). */
	tileSizes?: Array<number | Size>;
	/** Limits the tile range requested from the service. */
	extent?: Extent;
	/** `[TileMatrixWidth, TileMatrixHeight]` per matrix. */
	sizes?: Size[];
	/**
	 * Available tile index range `[minCol, maxCol, minRow, maxRow]` per matrix
	 * (for example from `TileMatrixSetLimits`). Used instead of `sizes`.
	 */
	tileRanges?: Array<[number, number, number, number]>;
};

/**
 * Builds the `ol/tilegrid/WMTS` instance OpenLayers needs from a JSON
 * description. Values that are not plain objects (for example a tile grid
 * instance) are passed through unchanged.
 */
const tileGridMapper: InitialOptionMapMapper<Ctor> = ({value}) => {
	if (!isPlainObject(value)) {
		return {tileGrid: value};
	}

	try {
		const {tileRanges, ...description} = value as WMTSTileGridDescription;
		return {
			tileGrid: new WMTSTileGrid({
				...description,
				tileRanges: tileRanges?.map(
					([minX, maxX, minY, maxY]) =>
						new TileRange(minX, maxX, minY, maxY),
				),
			}),
		};
	} catch (error) {
		console.error(
			"WMTSSource: could not create the tile grid from its description.",
			error,
		);
		return {};
	}
};

export default {
	type: "WMTSSource",
	Constructor: WMTS,
	optionMap: {...base.optionMap, dimensions: "updateDimensions"},
	initialOptionMap: {
		...base.initialOptionMap,
		version: "version",
		format: "format",
		layer: "layer",
		style: "style",
		matrixSet: "matrixSet",
		requestEncoding: "requestEncoding",
		dimensions: "dimensions",
		tileGrid: tileGridMapper,
	},
} satisfies Definition<Ctor>;
