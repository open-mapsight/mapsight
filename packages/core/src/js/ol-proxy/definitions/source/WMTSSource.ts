import TileRange from "ol/TileRange";
import type {Coordinate} from "ol/coordinate";
import type {Extent} from "ol/extent";
import type {Size} from "ol/size";
import WMTS from "ol/source/WMTS";
import WMTSTileGrid from "ol/tilegrid/WMTS";

import cloneDeep from "lodash/cloneDeep";
import isNil from "lodash/isNil";
import isPlainObject from "lodash/isPlainObject";
import omitBy from "lodash/omitBy";

import type {Definition, InitialOptionMapMapper} from "@/ol-proxy";

import base from "./TileImageSource";

type Ctor = typeof WMTS;

/**
 * Plain JSON description of a WMTS tile grid (see `ol/tilegrid/WMTS`).
 *
 * `matrixIds` and `resolutions` are required and need the same length;
 * `resolutions` must be strictly descending positive numbers. Either `origin`
 * (never together with `origins`), `origins` or `extent` has to be given as
 * well. `tileSize` and `tileSizes` are mutually exclusive. The description is
 * validated (see {@link validateWMTSTileGridDescription}) before a source is
 * created.
 */
export type WMTSTileGridDescription = {
	/** Top left corner of the grid, shared by all matrices. */
	origin?: Coordinate;
	/** Top left corner per matrix (same length as `resolutions`). */
	origins?: Coordinate[];
	/** Resolution (map units per pixel) per matrix, strictly descending. */
	resolutions: number[];
	/** `TileMatrix` identifiers, one per resolution. */
	matrixIds: string[];
	/** Tile size in pixels, shared by all matrices. */
	tileSize?: number | Size;
	/** Tile size per matrix (same length as `resolutions`). */
	tileSizes?: Array<number | Size>;
	/**
	 * Limits the tile range requested from the service, except where
	 * `tileRanges` are given: see there. Without `origin` and `origins`, the
	 * top left corner of the extent is the origin.
	 */
	extent?: Extent;
	/**
	 * `[TileMatrixWidth, TileMatrixHeight]` per matrix (same length as
	 * `resolutions`). Intersected with `extent` if one is given.
	 */
	sizes?: Size[];
	/**
	 * Available tile index range `[minCol, maxCol, minRow, maxRow]` per matrix
	 * (same length as `resolutions`, for example from
	 * `TileMatrixSetLimits`). OpenLayers uses them as they are, instead of
	 * `sizes`, and does **not** intersect them with `extent`: when both are
	 * given, `tileRanges` take precedence and `extent` no longer limits the
	 * tiles that are requested.
	 */
	tileRanges?: Array<[number, number, number, number]>;
};

const isFiniteNumber = (value: unknown): value is number =>
	typeof value === "number" && Number.isFinite(value);

const isNonNegativeInteger = (value: unknown): value is number =>
	typeof value === "number" && Number.isInteger(value) && value >= 0;

const isNumberTuple = (value: unknown, length: number): boolean =>
	Array.isArray(value) &&
	value.length === length &&
	value.every(isFiniteNumber);

function isTileSize(value: unknown): boolean {
	const isLength = (entry: unknown) => isFiniteNumber(entry) && entry > 0;
	return (
		isLength(value) ||
		(Array.isArray(value) && value.length === 2 && value.every(isLength))
	);
}

/** Checks a per-matrix array against `resolutions`. */
function checkPerMatrix(
	problems: string[],
	name: string,
	value: unknown,
	count: number | undefined,
	isValidEntry: (entry: unknown) => boolean,
	entryDescription: string,
) {
	if (!Array.isArray(value)) {
		problems.push(`\`${name}\` must be an array`);
		return;
	}
	if (count !== undefined && value.length !== count) {
		problems.push(
			`\`${name}\` and \`resolutions\` must have the same length (${value.length} and ${count})`,
		);
	}
	if (!value.every(isValidEntry)) {
		problems.push(`\`${name}\` must only contain ${entryDescription}`);
	}
}

/**
 * Checks a plain tile grid description against what `ol/tilegrid/WMTS`
 * requires, and against what would only fail later while rendering.
 *
 * `null` values count as not given.
 *
 * @returns a message per problem; empty if the description is usable
 */
export function validateWMTSTileGridDescription(
	description: unknown,
): string[] {
	if (!isPlainObject(description)) {
		return ["the tile grid description must be an object"];
	}

	const {
		origin,
		origins,
		resolutions,
		matrixIds,
		tileSize,
		tileSizes,
		extent,
		sizes,
		tileRanges,
	} = omitBy(description as Record<string, unknown>, isNil);

	const problems: string[] = [];

	if (!Array.isArray(resolutions) || resolutions.length === 0) {
		problems.push("`resolutions` must be a non-empty array of numbers");
	} else if (
		!resolutions.every((entry) => isFiniteNumber(entry) && entry > 0)
	) {
		problems.push(
			"`resolutions` must only contain positive finite numbers",
		);
	} else if (
		resolutions.some((entry, i) => i > 0 && entry >= resolutions[i - 1])
	) {
		problems.push(
			"`resolutions` must be sorted in strictly descending order",
		);
	}
	// Number of matrices all other per-matrix arrays have to match.
	const resolutionCount = Array.isArray(resolutions)
		? resolutions.length
		: undefined;

	if (!Array.isArray(matrixIds)) {
		problems.push("`matrixIds` must be an array of strings");
	} else {
		if (!matrixIds.every((id) => typeof id === "string" && id.length > 0)) {
			problems.push("`matrixIds` must only contain non-empty strings");
		}
		if (
			resolutionCount !== undefined &&
			matrixIds.length !== resolutionCount
		) {
			problems.push(
				`\`matrixIds\` and \`resolutions\` must have the same length (${matrixIds.length} and ${resolutionCount})`,
			);
		}
	}

	if (origin !== undefined && origins !== undefined) {
		problems.push("`origin` and `origins` must not be given together");
	} else if (
		origin === undefined &&
		origins === undefined &&
		extent === undefined
	) {
		problems.push("one of `origin`, `origins` or `extent` is required");
	}
	if (origin !== undefined && !isNumberTuple(origin, 2)) {
		problems.push(
			"`origin` must be a coordinate `[x, y]` of finite numbers",
		);
	}
	if (origins !== undefined) {
		checkPerMatrix(
			problems,
			"origins",
			origins,
			resolutionCount,
			(entry) => isNumberTuple(entry, 2),
			"coordinates `[x, y]` of finite numbers",
		);
	}

	if (extent !== undefined) {
		if (
			!isNumberTuple(extent, 4) ||
			(extent as number[])[0]! > (extent as number[])[2]! ||
			(extent as number[])[1]! > (extent as number[])[3]!
		) {
			problems.push(
				"`extent` must be `[minX, minY, maxX, maxY]` of finite numbers with min <= max",
			);
		}
	}

	if (tileSize !== undefined && tileSizes !== undefined) {
		problems.push("`tileSize` and `tileSizes` must not be given together");
	}
	if (tileSize !== undefined && !isTileSize(tileSize)) {
		problems.push(
			"`tileSize` must be a positive number or `[width, height]` of positive numbers",
		);
	}
	if (tileSizes !== undefined) {
		checkPerMatrix(
			problems,
			"tileSizes",
			tileSizes,
			resolutionCount,
			isTileSize,
			"positive numbers or `[width, height]` of positive numbers",
		);
	}

	if (sizes !== undefined) {
		checkPerMatrix(
			problems,
			"sizes",
			sizes,
			resolutionCount,
			(entry) =>
				Array.isArray(entry) &&
				entry.length === 2 &&
				entry.every(isNonNegativeInteger),
			"`[width, height]` of non-negative integers",
		);
	}
	if (tileRanges !== undefined) {
		checkPerMatrix(
			problems,
			"tileRanges",
			tileRanges,
			resolutionCount,
			(entry) =>
				Array.isArray(entry) &&
				entry.length === 4 &&
				entry.every(Number.isInteger),
			"`[minCol, maxCol, minRow, maxRow]` of integers",
		);
	}

	return problems;
}

/**
 * Builds the `ol/tilegrid/WMTS` instance from a JSON description. The
 * instance gets its own copy of every array in the description.
 *
 * @throws if the description is not valid, see
 *   {@link validateWMTSTileGridDescription}
 */
export function createWMTSTileGrid(description: unknown): WMTSTileGrid {
	const problems = validateWMTSTileGridDescription(description);
	if (problems.length > 0) {
		throw new Error(`invalid tileGrid description: ${problems.join("; ")}`);
	}

	const {tileRanges, ...rest} = cloneDeep(
		omitBy(description as Record<string, unknown>, isNil),
	) as unknown as WMTSTileGridDescription;
	return new WMTSTileGrid({
		origin: rest.origin,
		origins: rest.origins,
		resolutions: rest.resolutions,
		matrixIds: rest.matrixIds,
		tileSize: rest.tileSize,
		tileSizes: rest.tileSizes,
		extent: rest.extent,
		sizes: rest.sizes,
		tileRanges: tileRanges?.map(
			([minX, maxX, minY, maxY]) => new TileRange(minX, maxX, minY, maxY),
		),
	});
}

/**
 * OpenLayers keeps the dimensions object it is given and `updateDimensions`
 * merges into it, so the source gets its own copy: config state may be frozen
 * and must never be written to.
 */
const dimensionsMapper: InitialOptionMapMapper<Ctor> = ({value}) => ({
	dimensions: isPlainObject(value) ? cloneDeep(value) : value,
});

export default {
	type: "WMTSSource",
	Constructor: WMTS,
	events: {
		/**
		 * Replaces a tile grid description by the tile grid and rejects the
		 * source (nothing is created, one error is logged) if there is no usable
		 * one, so a source without a working tile grid never reaches the map.
		 */
		beforeCreation(options) {
			const tileGrid: unknown = options?.tileGrid;
			if (tileGrid instanceof WMTSTileGrid) {
				return;
			}
			if (!isPlainObject(tileGrid)) {
				throw new Error(
					"WMTSSource needs a `tileGrid` description (or an `ol/tilegrid/WMTS` instance).",
				);
			}
			options.tileGrid = createWMTSTileGrid(tileGrid);
		},
	},
	// `dimensions` is deliberately not updated in place: OpenLayers can only
	// merge into the dimensions of a source, never remove one, so a change
	// creates a new source (see `initialOptionMap`).
	optionMap: {...base.optionMap},
	initialOptionMap: {
		...base.initialOptionMap,
		version: "version",
		format: "format",
		layer: "layer",
		style: "style",
		matrixSet: "matrixSet",
		requestEncoding: "requestEncoding",
		dimensions: dimensionsMapper,
	},
} satisfies Definition<Ctor>;
