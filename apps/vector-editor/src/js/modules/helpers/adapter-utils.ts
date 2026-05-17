import type * as geojson from "geojson";

import type {FeatureSourceData} from "@mapsight/core/lib/feature-sources/types";
import type {Feature} from "@mapsight/core/types";

export function getQueryStringParameter(uri: string, key: string) {
	const re = new RegExp(`(?:^|[?&])${key}=(.*?)(?:&|$)`, "i");
	const match = re.exec(uri);
	return match && match[1];
}

export function readRemoteData(
	remoteDocument: Document | undefined,
	selector: string,
	attributeName = "value",
) {
	const element = remoteDocument?.querySelector(selector);
	return (
		element &&
		(attributeName === "value"
			? (element as HTMLInputElement).value
			: element.getAttribute(attributeName))
	);
}

type Data = geojson.Feature | geojson.FeatureCollection | geojson.Geometry;

export function readRemoteDataGeoJson(
	remoteDocument: Document,
	selector: string,
	attributeName = "value",
): FeatureSourceData | undefined {
	try {
		const jsonString = readRemoteData(
			remoteDocument,
			selector,
			attributeName,
		);
		let json = (jsonString ? JSON.parse(jsonString) : undefined) as
			| Data
			| undefined;

		// normalize type to feature collection
		json = json || {type: "FeatureCollection", features: []};
		if (json.type === "Feature") {
			json = {type: "FeatureCollection", features: [json]};
		} else if (json.type !== "FeatureCollection") {
			const feature: geojson.Feature = {
				type: "Feature",
				geometry: json,
				properties: [],
			};
			json = {type: "FeatureCollection", features: [feature]};
		}

		let i = 0;
		// unpack geometry collections and ensure unique ids per feature
		const features = json.features
			.flatMap((feature) => {
				if (feature.geometry.type === "GeometryCollection") {
					return feature.geometry.geometries;
				} else {
					return feature.geometry;
				}
			})
			.map(
				(geometry): Feature => ({
					type: "Feature",
					id: String(i++),
					geometry,
					properties: [],
				}),
			);

		return {features};
	} catch (_e) {
		return undefined;
	}
}

export function writeRemoteData(
	remoteDocument: Document,
	selector: string,
	data: string,
	attributeName = "value",
) {
	const element = remoteDocument.querySelector(selector);
	if (element && data) {
		if ("value" in element) {
			element.value = data;
		} else {
			element.setAttribute(attributeName, data);
		}
	}
}
