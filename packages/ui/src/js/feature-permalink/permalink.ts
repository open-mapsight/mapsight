import {lonLatFromGeometry} from "../helpers/geo";
import getFeatureProperty from "../helpers/get-feature-property";
import {isMarkedPointFeature} from "../plugins/browser/marked-point";
import {buildLinkMarkerShareHref} from "../plugins/browser/share-position-link";
import {
	FEATURE_SOURCE_SEARCH_PARAM,
	PERMALINK_SKIP_FEATURE_SOURCE_IDS,
	permalinkSourceId,
	sanitizeFeatureSourceId,
} from "../plugins/common/reveal-feature-source";
import type {MapsightUiFeature} from "../types";
import type {
	FeatureLocation,
	FeaturePermalinkConfig,
	FeaturePermalinkResolveContext,
} from "./types";

function asNonEmptyString(value: unknown): string | null {
	if (typeof value !== "string") {
		return null;
	}
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

export function featureLocationFromConfig(
	config: FeaturePermalinkConfig | undefined,
): FeatureLocation | null {
	if (config && "location" in config) {
		return config.location ?? null;
	}
	if (typeof window === "undefined") {
		return null;
	}
	return {
		origin: window.location.origin,
		pathname: window.location.pathname,
		search: window.location.search,
	};
}

function featureId(feature: MapsightUiFeature): string | null {
	const id = feature.id ?? feature.properties?.id;
	if (id == null || id === "") {
		return null;
	}
	return String(id);
}

function resolveConfiguredSourceId(
	feature: MapsightUiFeature,
	config: FeaturePermalinkConfig | undefined,
	ctx: FeaturePermalinkResolveContext,
): string | null {
	const configured = config?.featureSourceId;
	if (typeof configured === "function") {
		return sanitizeFeatureSourceId(configured(feature, ctx) ?? null);
	}
	return sanitizeFeatureSourceId(configured);
}

function resolveImpliedSourceIds(
	feature: MapsightUiFeature,
	config: FeaturePermalinkConfig | undefined,
	ctx: FeaturePermalinkResolveContext,
): readonly string[] | null {
	const configured = config?.impliedFeatureSourceIds;
	if (configured == null) {
		return null;
	}
	return typeof configured === "function"
		? configured(feature, ctx)
		: configured;
}

function resolvePermalinkSourceId(
	feature: MapsightUiFeature,
	config: FeaturePermalinkConfig | undefined,
	ctx: FeaturePermalinkResolveContext,
): string | null {
	const sourceId = resolveConfiguredSourceId(feature, config, ctx);
	if (
		sourceId &&
		(PERMALINK_SKIP_FEATURE_SOURCE_IDS as readonly string[]).includes(
			sourceId,
		)
	) {
		return null;
	}
	const hasSourceConfig =
		config?.featureSourceId !== undefined ||
		config?.impliedFeatureSourceIds !== undefined;
	const computed = permalinkSourceId(
		sourceId,
		resolveImpliedSourceIds(feature, config, ctx),
	);
	if (computed || hasSourceConfig) {
		return computed;
	}
	return sanitizeFeatureSourceId(
		new URLSearchParams(
			ctx.location?.search?.startsWith("?")
				? ctx.location.search.slice(1)
				: (ctx.location?.search ?? ""),
		).get(FEATURE_SOURCE_SEARCH_PARAM),
	);
}

function buildPermalinkFromLocation(
	feature: MapsightUiFeature,
	location: FeatureLocation | null,
	sourceId: string | null = null,
	replaceSourceParam = false,
): string | null {
	const id = featureId(feature);
	if (!id || !location?.origin || !location.pathname) {
		return null;
	}
	const params = new URLSearchParams(
		location.search?.startsWith("?")
			? location.search.slice(1)
			: (location.search ?? ""),
	);
	params.set("feature", id);
	const existingSource = params.get(FEATURE_SOURCE_SEARCH_PARAM);
	if (existingSource && !sanitizeFeatureSourceId(existingSource)) {
		params.delete(FEATURE_SOURCE_SEARCH_PARAM);
	}
	if (sourceId) {
		params.set(FEATURE_SOURCE_SEARCH_PARAM, sourceId);
	} else if (replaceSourceParam) {
		params.delete(FEATURE_SOURCE_SEARCH_PARAM);
	}
	const query = params.toString();
	return `${location.origin}${location.pathname}${query ? `?${query}` : ""}`;
}

function resolvePermalink(
	feature: MapsightUiFeature,
	config: FeaturePermalinkConfig | undefined,
	ctx: FeaturePermalinkResolveContext,
): string | null {
	if (typeof config?.permalink === "string") {
		return asNonEmptyString(config.permalink);
	}
	if (typeof config?.permalink === "function") {
		return asNonEmptyString(config.permalink(feature, ctx) ?? null);
	}
	const permanentLink = asNonEmptyString(
		getFeatureProperty(feature, "permanentLink"),
	);
	if (permanentLink) {
		return permanentLink;
	}
	if (isMarkedPointFeature(feature)) {
		const coords = lonLatFromGeometry(feature);
		if (coords && ctx.location?.origin && ctx.location.pathname) {
			return buildLinkMarkerShareHref(
				coords.lat,
				coords.lon,
				ctx.location,
			);
		}
		return null;
	}
	const hasSourceConfig =
		config?.featureSourceId !== undefined ||
		config?.impliedFeatureSourceIds !== undefined;
	return buildPermalinkFromLocation(
		feature,
		ctx.location,
		resolvePermalinkSourceId(feature, config, ctx),
		hasSourceConfig,
	);
}

export function resolveFeaturePermalink(
	feature: MapsightUiFeature,
	config: FeaturePermalinkConfig = {},
): string | null {
	return resolvePermalink(feature, config, {
		location: featureLocationFromConfig(config),
	});
}
