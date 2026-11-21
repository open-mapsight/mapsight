/** Loosely typed output of the OpenLayers capabilities parsers. */
export type RawObject = Record<string, unknown>;

export type GeographicBoundingBox = [
	west: number,
	south: number,
	east: number,
	north: number,
];

export const isRawObject = (value: unknown): value is RawObject =>
	typeof value === "object" && value !== null && !Array.isArray(value);

export function asArray(value: unknown): unknown[] {
	if (Array.isArray(value)) {
		return value;
	}
	return value === undefined || value === null ? [] : [value];
}

/** Trimmed, non-empty string or `undefined`. */
export function asText(value: unknown): string | undefined {
	if (typeof value !== "string") {
		return undefined;
	}
	const text = value.trim();
	return text === "" ? undefined : text;
}

/**
 * Only absolute `http(s)` URLs are taken over from a capabilities document, so
 * a document cannot smuggle in other URL schemes.
 */
export function isHttpUrl(value: unknown): value is string {
	return typeof value === "string" && /^https?:\/\//i.test(value.trim());
}

/**
 * Removes duplicates, keeping the first occurrence. Values are compared
 * exactly: layer names, style, matrix set and format identifiers are case
 * sensitive. Use {@link uniqueCrs} for CRS codes.
 */
export function unique(values: string[]): string[] {
	return [...new Set(values)];
}

/**
 * Removes duplicate CRS codes, keeping the first occurrence and its casing.
 * Unlike other identifiers, CRS codes are not case sensitive
 * (`EPSG:3857` and `epsg:3857` are the same).
 */
export function uniqueCrs(codes: string[]): string[] {
	const seen = new Set<string>();
	return codes.filter((code) => {
		const key = code.toLowerCase();
		if (seen.has(key)) {
			return false;
		}
		seen.add(key);
		return true;
	});
}

export function asBoundingBox(
	value: unknown,
): GeographicBoundingBox | undefined {
	if (
		Array.isArray(value) &&
		value.length === 4 &&
		value.every((entry) => typeof entry === "number" && isFinite(entry))
	) {
		return [value[0], value[1], value[2], value[3]];
	}
	return undefined;
}

/**
 * Parses an XML string. Needs a DOM implementation (`DOMParser`): available in
 * browsers and in jsdom, but not in plain Node.js.
 */
export function parseXmlDocument(xml: string): Document {
	if (typeof DOMParser === "undefined") {
		throw new Error(
			"Parsing a capabilities document needs a DOM (DOMParser). " +
				"Parse it elsewhere and pass the parsed object instead.",
		);
	}

	const document = new DOMParser().parseFromString(xml, "text/xml");
	if (document.getElementsByTagName("parsererror").length > 0) {
		throw new Error("The capabilities document is not well-formed XML.");
	}
	return document;
}
