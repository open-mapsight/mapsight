import getFeatureProperty from "../../helpers/get-feature-property";
import type {MapsightUiFeature} from "../../types";
import {
	resolveFeaturePermalink,
	resolveFeatureSchema,
} from "./resolve-place-actions";
import type {FeatureSchema, PlaceActionsConfig} from "./types";

export type PlacePageMetaOg = {
	title: string;
	description: string;
	url: string;
	type: "place" | "website";
	image: string;
};

export type PlacePageMeta = {
	title: string;
	description: string;
	canonicalUrl: string;
	og: PlacePageMetaOg;
	jsonLd: Record<string, unknown>;
};

export type BuildPlacePageMetaConfig = PlaceActionsConfig & {
	/** Absolute or root-absolute URL for the static default card. */
	ogImage: string;
	ogType?: "place" | "website";
};

const OG_DESCRIPTION_MAX = 180;

function asNonEmptyString(value: unknown): string | null {
	if (typeof value !== "string") {
		return null;
	}
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

function featureTitle(feature: MapsightUiFeature): string {
	return (
		asNonEmptyString(getFeatureProperty(feature, "name")) ??
		asNonEmptyString(getFeatureProperty(feature, "title")) ??
		asNonEmptyString(getFeatureProperty(feature, "listName")) ??
		""
	);
}

function stripTags(html: string): string {
	return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function ogDescription(feature: MapsightUiFeature, title: string): string {
	const raw = getFeatureProperty(feature, "description");
	const stripped =
		typeof raw === "string" ? stripTags(raw) : "";
	const text = stripped.length > 0 ? stripped : title;
	if (text.length <= OG_DESCRIPTION_MAX) {
		return text;
	}
	return `${text.slice(0, OG_DESCRIPTION_MAX - 1).trimEnd()}…`;
}

function lonLatFromGeometry(
	feature: MapsightUiFeature,
): {lon: number; lat: number} | null {
	const geometry = feature.geometry as
		{type?: string; coordinates?: unknown} | undefined;
	const coordinates = geometry?.coordinates;
	if (geometry?.type === "Point" && Array.isArray(coordinates)) {
		const lon = coordinates[0];
		const lat = coordinates[1];
		if (typeof lon === "number" && typeof lat === "number") {
			return {lon, lat};
		}
	}
	return null;
}

function sameAsList(schema: FeatureSchema): string[] {
	if (schema.sameAs == null) {
		return [];
	}
	const values = Array.isArray(schema.sameAs)
		? schema.sameAs
		: [schema.sameAs];
	return values
		.map((value) => asNonEmptyString(value))
		.filter((value): value is string => value != null);
}

/**
 * Document meta for a selected feature. Null when title or canonical URL
 * cannot be built (caller fail-opens to page defaults).
 */
export function buildPlacePageMeta(
	feature: MapsightUiFeature,
	config: BuildPlacePageMetaConfig,
): PlacePageMeta | null {
	const title = featureTitle(feature);
	const canonicalUrl = resolveFeaturePermalink(feature, config);
	const ogImage = asNonEmptyString(config.ogImage);
	if (!title || !canonicalUrl || !ogImage) {
		return null;
	}

	const description = ogDescription(feature, title);
	const schema = resolveFeatureSchema(feature, config);
	const coords = lonLatFromGeometry(feature);
	const sameAs = sameAsList(schema);
	const ogType = config.ogType ?? "place";

	const jsonLd: Record<string, unknown> = {
		"@context": "https://schema.org",
		"@type": schema["@type"] ?? "Place",
		name: title,
	};
	if (asNonEmptyString(schema.url)) {
		jsonLd.url = schema.url;
	}
	if (asNonEmptyString(schema.telephone)) {
		jsonLd.telephone = schema.telephone;
	}
	if (coords) {
		jsonLd.geo = {
			"@type": "GeoCoordinates",
			latitude: coords.lat,
			longitude: coords.lon,
		};
	}
	if (sameAs.length === 1) {
		jsonLd.sameAs = sameAs[0];
	} else if (sameAs.length > 1) {
		jsonLd.sameAs = sameAs;
	}

	return {
		title,
		description,
		canonicalUrl,
		og: {
			title,
			description,
			url: canonicalUrl,
			type: ogType,
			image: ogImage,
		},
		jsonLd,
	};
}
