import WMTSCapabilities from "ol/format/WMTSCapabilities";
import type {Size} from "ol/size";
import {optionsFromCapabilities} from "ol/source/WMTS";
import type WMTSTileGrid from "ol/tilegrid/WMTS";

import type {Description} from "@mapsight/core/lib/map/types";
import type {WMTSTileGridDescription} from "@mapsight/core/ol-proxy/definitions/source/WMTSSource";
import {validateWMTSTileGridDescription} from "@mapsight/core/ol-proxy/definitions/source/WMTSSource";

import type {GeographicBoundingBox, RawObject} from "./util";
import {
	asArray,
	asBoundingBox,
	asText,
	isHttpUrl,
	isRawObject,
	parseXmlDocument,
	unique,
	uniqueCrs,
} from "./util";

/**
 * One layer of a WMTS capabilities document.
 *
 * All text fields (`title`, `abstract`, identifiers) are taken from the
 * document and therefore untrusted. They are plain data: do not render them as
 * HTML and they are deliberately not written into the layer definition.
 */
export type WmtsLayerEntry = {
	/** The layer `Identifier`. */
	name: string;
	/** The layer `Title`, or the identifier if there is none. */
	title: string;
	abstract?: string;
	/** `[west, south, east, north]` in degrees. */
	geographicBoundingBox?: GeographicBoundingBox;
	/** CRS codes of the tile matrix sets the layer is published in. */
	crs: string[];
	/** Identifiers of the tile matrix sets the layer is published in. */
	matrixSets: string[];
	/** Identifiers of the styles. */
	styles: string[];
	/** Image formats the layer is published in. */
	formats: string[];
	/**
	 * Ready-to-use layer definition (`TileLayer` with a `WMTSSource`) for
	 * `map.layers`. It is plain JSON in the shape the `WMTSSource` ol-proxy
	 * definition accepts and contains no text from the document except
	 * identifiers and URLs.
	 */
	definition: Description;
};

export type WmtsCapabilitiesToLayersOptions = {
	/**
	 * Identifier of the tile matrix set to use. Layers that are not published
	 * in it are left out.
	 */
	matrixSet?: string;
	/**
	 * Preferred projection used to choose between a layer's tile matrix sets.
	 * Layers without a matching tile matrix set use their first one.
	 * Defaults to `EPSG:3857`. The projection of every used tile matrix set
	 * must be registered in OpenLayers, otherwise the layer is left out.
	 */
	projection?: string;
	/**
	 * Identifier of the style to use. Layers that do not have it are left out.
	 * Defaults to the layer's default style.
	 */
	style?: string;
};

/**
 * Describes the tile grid OpenLayers derived from the capabilities as plain
 * JSON, or returns `undefined` if the result would not be a valid, finite
 * description (for example because a tile matrix lacks its `ScaleDenominator`
 * and OpenLayers computed `NaN`, which JSON turns into `null`).
 */
function describeValidTileGrid(
	tileGrid: WMTSTileGrid,
): WMTSTileGridDescription | undefined {
	try {
		const description = describeTileGrid(tileGrid);
		return validateWMTSTileGridDescription(description).length === 0
			? description
			: undefined;
	} catch {
		return undefined;
	}
}

function describeTileGrid(tileGrid: WMTSTileGrid): WMTSTileGridDescription {
	const resolutions = tileGrid.getResolutions();
	const ranges = resolutions.map((_, z) => tileGrid.getFullTileRange(z));

	const description: WMTSTileGridDescription = {
		origins: resolutions.map((_, z) => tileGrid.getOrigin(z)),
		resolutions: [...resolutions],
		matrixIds: [...tileGrid.getMatrixIds()],
		tileSizes: resolutions.map((_, z) => {
			const size = tileGrid.getTileSize(z);
			if (typeof size === "number") {
				return size;
			}
			// Do not fill in missing values: the validation has to see them.
			const [width, height] = size as Array<number | undefined>;
			return (width === height ? width : [width, height]) as
				number | Size;
		}),
	};

	const extent = tileGrid.getExtent();
	if (extent) {
		description.extent = [...extent];
	}

	const available = ranges.filter((range) => range !== null);
	if (available.length === ranges.length) {
		if (available.every((range) => range.minX === 0 && range.minY === 0)) {
			description.sizes = available.map((range) => [
				range.maxX + 1,
				range.maxY + 1,
			]);
		} else {
			description.tileRanges = available.map(
				({minX, maxX, minY, maxY}) => [minX, maxX, minY, maxY],
			);
		}
	}

	return description;
}

function readLayerData(layer: RawObject, matrixSets: RawObject[]) {
	const matrixSetIds = unique(
		asArray(layer["TileMatrixSetLink"]).flatMap((link) =>
			isRawObject(link) ? (asText(link["TileMatrixSet"]) ?? []) : [],
		),
	);
	const crs = uniqueCrs(
		matrixSetIds.flatMap((id) => {
			const matrixSet = matrixSets.find(
				(candidate) => candidate["Identifier"] === id,
			);
			return asText(matrixSet?.["SupportedCRS"]) ?? [];
		}),
	);
	const styles = unique(
		asArray(layer["Style"]).flatMap((style) =>
			isRawObject(style) ? (asText(style["Identifier"]) ?? []) : [],
		),
	);
	const formats = unique(
		asArray(layer["Format"]).flatMap((format) => asText(format) ?? []),
	);
	return {matrixSetIds, crs, styles, formats};
}

/**
 * Turns a WMTS capabilities document into one entry per layer.
 *
 * Each entry carries plain data and a layer `definition` (`TileLayer` with a
 * `WMTSSource`). The source options are plain JSON: layer, style, matrix set,
 * format, request encoding, tile URL(s), projection code, a tile grid
 * description and dimensions (their default values). They are selected with
 * `optionsFromCapabilities` from `ol/source/WMTS` and need the `WMTSSource`
 * definition (`@mapsight/core/ol-proxy/definitions/source/WMTSSource`)
 * registered in ol-proxy, for example with
 * `createOlProxyPlugin({dependencies: [WMTSSource]})`.
 *
 * Layers for which no usable source can be derived are left out: unknown
 * matrix set or style, unregistered projection, no `http(s)` tile URL, or
 * malformed tile matrix data (for example a missing or non-numeric
 * `ScaleDenominator`, `TopLeftCorner`, `TileWidth` or `MatrixWidth`, or tile
 * matrices that share a `ScaleDenominator`). The derived tile grid
 * has to pass the same validation as a `WMTSSource` tile grid description
 * (`validateWMTSTileGridDescription`), so no returned definition holds
 * `NaN` (which JSON turns into `null`) or fails to create a source.
 *
 * This function does not fetch anything: the host application loads the
 * capabilities document (including CORS or proxy handling) and passes it in.
 * Parsing an XML string needs a DOM (`DOMParser`); in an environment without
 * one, parse the document elsewhere and pass the parsed object.
 *
 * **Untrusted text:** titles, abstracts and identifiers come from the remote
 * document. They are returned as plain data only and are never written to
 * `metaData.attribution`, legends or other fields the Mapsight UI may render as
 * HTML, and the definitions carry no `metaData` at all. Set `metaData` (for
 * example a title) yourself, and render these strings as text.
 *
 * @param capabilities capabilities XML string, or its parsed form
 *   (`new WMTSCapabilities().read(xml)`)
 * @param options matrix set, preferred projection and style
 * @returns entries in document order
 */
export function wmtsCapabilitiesToLayers(
	capabilities: string | RawObject,
	options: WmtsCapabilitiesToLayersOptions = {},
): WmtsLayerEntry[] {
	const parsed: unknown =
		typeof capabilities === "string"
			? new WMTSCapabilities().readFromDocument(
					parseXmlDocument(capabilities),
				)
			: capabilities;

	const contents = isRawObject(parsed) ? parsed["Contents"] : undefined;
	if (!isRawObject(parsed) || !isRawObject(contents)) {
		throw new Error("Not a WMTS capabilities document.");
	}

	const matrixSets = asArray(contents["TileMatrixSet"]).filter(isRawObject);
	// `optionsFromCapabilities` sorts the tile matrices in place: work on copies
	// so a parsed object passed in by the caller stays untouched.
	const safeCapabilities: RawObject = {
		...parsed,
		Contents: {
			...contents,
			TileMatrixSet: matrixSets.map((matrixSet) => ({
				...matrixSet,
				TileMatrix: asArray(matrixSet["TileMatrix"]).slice(),
			})),
		},
	};

	const entries: WmtsLayerEntry[] = [];

	for (const layer of asArray(contents["Layer"])) {
		const name = isRawObject(layer)
			? asText(layer["Identifier"])
			: undefined;
		if (!isRawObject(layer) || name === undefined) {
			continue;
		}

		const {matrixSetIds, crs, styles, formats} = readLayerData(
			layer,
			matrixSets,
		);

		if (options.style !== undefined && !styles.includes(options.style)) {
			continue;
		}

		let source: ReturnType<typeof optionsFromCapabilities> = null;
		try {
			source = optionsFromCapabilities(safeCapabilities, {
				layer: name,
				projection: options.projection ?? "EPSG:3857",
				...(options.matrixSet !== undefined && {
					matrixSet: options.matrixSet,
				}),
			});
		} catch {
			// e.g. a tile matrix set in a projection that is not registered
		}

		// `optionsFromCapabilities` falls back to the first matrix set when the
		// requested one is unknown: do not hide that.
		if (
			!source ||
			(options.matrixSet !== undefined &&
				source.matrixSet !== options.matrixSet)
		) {
			continue;
		}

		const tileGrid = describeValidTileGrid(source.tileGrid);
		const urls = (source.urls ?? []).filter(isHttpUrl);
		const projection =
			typeof source.projection === "string"
				? source.projection
				: source.projection?.getCode();
		if (urls.length === 0 || !projection || !tileGrid) {
			continue;
		}

		const dimensions = Object.fromEntries(
			Object.entries(
				(source.dimensions ?? {}) as Record<string, unknown>,
			).map(([key, value]) => [key, String(value)]),
		);
		const version = asText(parsed["version"]);
		const abstract = asText(layer["Abstract"]);
		const geographicBoundingBox = asBoundingBox(layer["WGS84BoundingBox"]);

		entries.push({
			name,
			title: asText(layer["Title"]) ?? name,
			...(abstract !== undefined && {abstract}),
			...(geographicBoundingBox && {geographicBoundingBox}),
			crs,
			matrixSets: matrixSetIds,
			styles,
			formats,
			definition: {
				type: "TileLayer",
				options: {
					source: {
						type: "WMTSSource",
						options: {
							urls,
							layer: name,
							style: options.style ?? source.style,
							matrixSet: source.matrixSet,
							...(source.format !== undefined && {
								format: source.format,
							}),
							...(source.requestEncoding !== undefined && {
								requestEncoding: source.requestEncoding,
							}),
							...(version !== undefined && {version}),
							projection,
							tileGrid,
							...(Object.keys(dimensions).length > 0 && {
								dimensions,
							}),
							wrapX: source.wrapX ?? false,
						},
					},
				},
			},
		});
	}

	return entries;
}
