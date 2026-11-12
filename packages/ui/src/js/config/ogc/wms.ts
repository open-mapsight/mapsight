import WMSCapabilities from "ol/format/WMSCapabilities";

import type {Description} from "@mapsight/core/lib/map/types";

import type {GeographicBoundingBox, RawObject} from "./util";
import {
	asArray,
	asBoundingBox,
	asText,
	isHttpUrl,
	isRawObject,
	parseXmlDocument,
	unique,
} from "./util";

/**
 * One named layer of a WMS capabilities document.
 *
 * All text fields (`title`, `abstract`, `attribution`, style names) are taken
 * from the document and therefore untrusted. They are plain data: do not render
 * them as HTML and they are deliberately not written into the layer definition.
 */
export type WmsLayerEntry = {
	/** The `Name` to use in the `LAYERS` parameter. */
	name: string;
	/** The layer `Title`, or the name if there is none. */
	title: string;
	abstract?: string;
	/** `[west, south, east, north]` in degrees. */
	geographicBoundingBox?: GeographicBoundingBox;
	/** Supported CRS codes, own and inherited, e.g. `EPSG:3857`. */
	crs: string[];
	/** Names of the styles, own and inherited. */
	styles: string[];
	queryable: boolean;
	/** Title of the layer's `Attribution` element, if the service gives one. */
	attribution?: string;
	/**
	 * Ready-to-use layer definition (`TileLayer` with a `TileWMSSource`) for
	 * `map.layers`. It contains no text from the document except the layer name
	 * and URLs.
	 */
	definition: Description;
};

export type WmsCapabilitiesToLayersOptions = {
	/** `GetMap` URL; defaults to the one advertised in the capabilities. */
	url?: string;
	/** Image format; defaults to an advertised one, preferring PNG. */
	format?: string;
	/**
	 * CRS code the source should request, e.g. `EPSG:3857`. Layers that do not
	 * advertise it are left out. Without it the source follows the map view.
	 */
	projection?: string;
};

type Inherited = {
	crs: string[];
	geographicBoundingBox?: GeographicBoundingBox;
	styles: string[];
	attribution?: string;
	queryable: boolean;
};

const FORMAT_PREFERENCE = [
	(format: string) => format === "image/png",
	(format: string) => format.startsWith("image/png"),
	(format: string) => format === "image/webp",
	(format: string) => format === "image/gif",
	(format: string) => /^image\/jpe?g$/.test(format),
];

function chooseFormat(
	advertised: string[],
	requested: string | undefined,
): string {
	if (requested) {
		return requested;
	}
	for (const matches of FORMAT_PREFERENCE) {
		const format = advertised.find(matches);
		if (format) {
			return format;
		}
	}
	return advertised[0] ?? "image/png";
}

function getMapOperation(capabilities: RawObject): RawObject | undefined {
	const capability = capabilities["Capability"];
	const request = isRawObject(capability) ? capability["Request"] : undefined;
	const getMap = isRawObject(request) ? request["GetMap"] : undefined;
	return isRawObject(getMap) ? getMap : undefined;
}

function getMapUrl(operation: RawObject | undefined): string | undefined {
	for (const dcp of asArray(operation?.["DCPType"])) {
		const http = isRawObject(dcp) ? dcp["HTTP"] : undefined;
		const get = isRawObject(http) ? http["Get"] : undefined;
		const url = isRawObject(get) ? get["OnlineResource"] : undefined;
		if (isHttpUrl(url)) {
			return url.trim();
		}
	}
	return undefined;
}

/**
 * The OpenLayers parser does not carry the `queryable` attribute down to
 * nested layers. Resolve it from the XML (it is inherited, default `false`).
 */
function readQueryableByName(document: Document): Map<string, boolean> {
	const result = new Map<string, boolean>();

	const visit = (layer: Element, inherited: boolean) => {
		const attribute = layer.getAttribute("queryable");
		const queryable =
			attribute === null
				? inherited
				: attribute === "1" || attribute.toLowerCase() === "true";

		const children = Array.from(layer.children);
		const name = children
			.find((child) => child.localName === "Name")
			?.textContent?.trim();
		if (name && !result.has(name)) {
			result.set(name, queryable);
		}
		for (const child of children) {
			if (child.localName === "Layer") {
				visit(child, queryable);
			}
		}
	};

	for (const capability of Array.from(document.documentElement.children)) {
		if (capability.localName !== "Capability") {
			continue;
		}
		for (const layer of Array.from(capability.children)) {
			if (layer.localName === "Layer") {
				visit(layer, false);
			}
		}
	}

	return result;
}

function readCrs(layer: RawObject): string[] {
	return asArray(layer["CRS"] ?? layer["SRS"]).flatMap((value) =>
		// WMS 1.1.1 allows several space separated codes in one `SRS` element.
		typeof value === "string" ? value.split(/\s+/).filter(Boolean) : [],
	);
}

function readGeographicBoundingBox(
	layer: RawObject,
): GeographicBoundingBox | undefined {
	const v13 = asBoundingBox(layer["EX_GeographicBoundingBox"]);
	if (v13) {
		return v13;
	}
	const latLon = layer["LatLonBoundingBox"];
	return isRawObject(latLon) ? asBoundingBox(latLon["extent"]) : undefined;
}

function readStyleNames(layer: RawObject): string[] {
	return asArray(layer["Style"]).flatMap((style) => {
		const name = isRawObject(style) ? asText(style["Name"]) : undefined;
		return name ? [name] : [];
	});
}

function readAttribution(layer: RawObject): string | undefined {
	const attribution = layer["Attribution"];
	return isRawObject(attribution) ? asText(attribution["Title"]) : undefined;
}

/**
 * Turns a WMS capabilities document into one entry per named layer.
 *
 * Nested layers are flattened. Values a child layer inherits from its parents
 * (CRS, styles, geographic bounding box, attribution, `queryable`) are resolved
 * as described in the WMS specification; a child's own geographic bounding box
 * and attribution replace the inherited ones, CRS and styles are added.
 *
 * Every entry carries plain data and a layer `definition` (`TileLayer` with a
 * `TileWMSSource`) that can be put into `map.layers`. The definition needs
 * `TileLayer` and `TileWMSSource` registered in ol-proxy (both are by default).
 *
 * This function does not fetch anything: the host application loads the
 * capabilities document (including CORS or proxy handling) and passes it in.
 * Parsing an XML string needs a DOM (`DOMParser`); in an environment without
 * one, parse the document elsewhere and pass the parsed object.
 *
 * **Untrusted text:** titles, abstracts, style names and attribution come from
 * the remote document. They are returned as plain data only and are never
 * written to `metaData.attribution`, legends or other fields the Mapsight UI may
 * render as HTML, and the definitions carry no `metaData` at all. Set
 * `metaData` (for example a title) yourself, and render these strings as text.
 *
 * @param capabilities capabilities XML string, or its parsed form
 *   (`new WMSCapabilities().read(xml)`)
 * @param options format, projection and `GetMap` URL
 * @returns entries in document order
 */
export function wmsCapabilitiesToLayers(
	capabilities: string | RawObject,
	options: WmsCapabilitiesToLayersOptions = {},
): WmsLayerEntry[] {
	let queryableByName: Map<string, boolean> | undefined;
	let parsed: unknown;
	if (typeof capabilities === "string") {
		const document = parseXmlDocument(capabilities);
		parsed = new WMSCapabilities().readFromDocument(document);
		queryableByName = readQueryableByName(document);
	} else {
		parsed = capabilities;
	}

	const capability = isRawObject(parsed) ? parsed["Capability"] : undefined;
	const root = isRawObject(capability) ? capability["Layer"] : undefined;
	if (!isRawObject(parsed) || !isRawObject(root)) {
		throw new Error("Not a WMS capabilities document.");
	}

	const operation = getMapOperation(parsed);
	const url = options.url ?? getMapUrl(operation);
	if (!url) {
		throw new Error(
			"The capabilities do not advertise a GetMap URL; pass options.url.",
		);
	}
	const version = asText(parsed["version"]) ?? "1.3.0";
	const format = chooseFormat(
		asArray(operation?.["Format"]).flatMap((entry) => asText(entry) ?? []),
		options.format,
	);
	const projection = options.projection;

	const entries: WmsLayerEntry[] = [];

	const visit = (layer: RawObject, inherited: Inherited) => {
		const name = asText(layer["Name"]);
		// Explicit `queryable` is resolved from the XML where it is available.
		const queryable =
			(name !== undefined ? queryableByName?.get(name) : undefined) ??
			(typeof layer["queryable"] === "boolean"
				? layer["queryable"]
				: inherited.queryable);

		const resolved: Inherited = {
			crs: unique([...readCrs(layer), ...inherited.crs]),
			geographicBoundingBox:
				readGeographicBoundingBox(layer) ??
				inherited.geographicBoundingBox,
			styles: unique([...readStyleNames(layer), ...inherited.styles]),
			attribution: readAttribution(layer) ?? inherited.attribution,
			queryable,
		};

		const supportsProjection =
			projection === undefined ||
			resolved.crs.some(
				(code) => code.toLowerCase() === projection.toLowerCase(),
			);

		if (name !== undefined && supportsProjection) {
			const abstract = asText(layer["Abstract"]);
			entries.push({
				name,
				title: asText(layer["Title"]) ?? name,
				...(abstract !== undefined && {abstract}),
				...(resolved.geographicBoundingBox && {
					geographicBoundingBox: resolved.geographicBoundingBox,
				}),
				crs: resolved.crs,
				styles: resolved.styles,
				queryable: resolved.queryable,
				...(resolved.attribution !== undefined && {
					attribution: resolved.attribution,
				}),
				definition: {
					type: "TileLayer",
					options: {
						source: {
							type: "TileWMSSource",
							options: {
								url,
								params: {
									LAYERS: name,
									VERSION: version,
									FORMAT: format,
									TRANSPARENT: true,
								},
								...(projection !== undefined && {projection}),
							},
						},
					},
				},
			});
		}

		for (const child of asArray(layer["Layer"])) {
			if (isRawObject(child)) {
				visit(child, resolved);
			}
		}
	};

	visit(root, {crs: [], styles: [], queryable: false});

	return entries;
}
