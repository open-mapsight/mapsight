import type {MapsightUiFeature} from "../types";
import type {FeaturePermalinkConfig, FeatureSchema} from "./types";

const DEFAULT_SCHEMA_TYPE = "Place";

function asNonEmptyString(value: unknown): string | null {
	if (typeof value !== "string") {
		return null;
	}
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

function readRawSchema(
	feature: MapsightUiFeature,
	config: FeaturePermalinkConfig | undefined,
): FeatureSchema | null {
	if (config?.schema) {
		return config.schema(feature) ?? null;
	}
	const schema = feature.properties?.schema;
	if (schema == null || typeof schema !== "object" || Array.isArray(schema)) {
		return null;
	}
	return schema;
}

function pickKnownSchemaFields(
	raw: FeatureSchema | null,
): Pick<FeatureSchema, "url" | "telephone" | "sameAs" | "@type"> {
	if (!raw) {
		return {};
	}
	return {
		...(raw["@type"] != null ? {"@type": raw["@type"]} : {}),
		...(raw.url != null ? {url: raw.url} : {}),
		...(raw.telephone != null ? {telephone: raw.telephone} : {}),
		...(raw.sameAs != null ? {sameAs: raw.sameAs} : {}),
	};
}

/**
 * Known schema fields only (`@type`, `url`, `telephone`, host-marked `sameAs`).
 * Extra schema.org keys are ignored. `@type` defaults to Place without writing
 * back onto the feature.
 */
export function resolveFeatureSchema(
	feature: MapsightUiFeature,
	config: FeaturePermalinkConfig = {},
): FeatureSchema {
	const raw = pickKnownSchemaFields(readRawSchema(feature, config));
	const fromDefault = pickKnownSchemaFields(config.schemaDefault ?? null);
	const merged: FeatureSchema = {
		...fromDefault,
		...raw,
	};
	const schemaType =
		asNonEmptyString(merged["@type"]) ??
		asNonEmptyString(fromDefault["@type"]) ??
		DEFAULT_SCHEMA_TYPE;
	return {
		...merged,
		"@type": schemaType,
	};
}
