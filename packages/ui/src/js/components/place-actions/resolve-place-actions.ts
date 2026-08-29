import getFeatureProperty from "../../helpers/get-feature-property";
import {translate} from "../../helpers/i18n";
import type {MapsightUiFeature} from "../../types";
import {supportsGeoProtocol} from "./supports-geo-protocol";
import type {
	CallPlaceAction,
	CustomNavTarget,
	FeatureSchema,
	NavigatePlaceAction,
	PlaceAction,
	PlaceActionsConfig,
	PlaceActionsLocation,
	PlaceActionsResolveContext,
	ResolvedNavTarget,
	SharePlaceAction,
	WebsitePlaceAction,
} from "./types";

const DEFAULT_NAV_TARGETS = ["geo", "google", "apple"] as const;
const DEFAULT_SCHEMA_TYPE = "Place";

function asNonEmptyString(value: unknown): string | null {
	if (typeof value !== "string") {
		return null;
	}
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

function asHttpOrHttpsUrl(value: unknown): string | null {
	const href = asNonEmptyString(value);
	if (!href) {
		return null;
	}
	try {
		const protocol = new URL(href).protocol;
		if (protocol === "http:" || protocol === "https:") {
			return href;
		}
	} catch {
		return null;
	}
	return null;
}

function readRawSchema(
	feature: MapsightUiFeature,
	config: PlaceActionsConfig | undefined,
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
	config: PlaceActionsConfig = {},
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

function currentLocation(
	config: PlaceActionsConfig | undefined,
): PlaceActionsLocation | null {
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

function buildPermalinkFromLocation(
	feature: MapsightUiFeature,
	location: PlaceActionsLocation | null,
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
	const query = params.toString();
	return `${location.origin}${location.pathname}${query ? `?${query}` : ""}`;
}

function resolvePermalink(
	feature: MapsightUiFeature,
	config: PlaceActionsConfig | undefined,
	ctx: PlaceActionsResolveContext,
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
	return buildPermalinkFromLocation(feature, ctx.location);
}

function featureTitle(feature: MapsightUiFeature): string {
	return (
		asNonEmptyString(getFeatureProperty(feature, "name")) ??
		asNonEmptyString(getFeatureProperty(feature, "title")) ??
		asNonEmptyString(getFeatureProperty(feature, "listName")) ??
		""
	);
}

function resolveShareTitle(
	feature: MapsightUiFeature,
	config: PlaceActionsConfig | undefined,
): string {
	const title = config?.share?.title;
	if (typeof title === "function") {
		return title(feature);
	}
	if (typeof title === "string") {
		return title;
	}
	return featureTitle(feature);
}

function lonLatFromGeometry(
	feature: MapsightUiFeature,
): {lon: number; lat: number} | null {
	const geometry = feature.geometry as
		{type?: string; coordinates?: unknown} | undefined;
	if (geometry?.type === "Point" && Array.isArray(geometry.coordinates)) {
		const lon = geometry.coordinates[0];
		const lat = geometry.coordinates[1];
		if (typeof lon === "number" && typeof lat === "number") {
			return {lon, lat};
		}
	}
	const bbox = feature.bbox;
	if (bbox && bbox.length >= 4) {
		const minX = bbox[0];
		const minY = bbox[1];
		const maxX = bbox[2];
		const maxY = bbox[3];
		if (
			typeof minX === "number" &&
			typeof minY === "number" &&
			typeof maxX === "number" &&
			typeof maxY === "number"
		) {
			return {lon: (minX + maxX) / 2, lat: (minY + maxY) / 2};
		}
	}
	return null;
}

function geoProtocolSupported(config: PlaceActionsConfig | undefined): boolean {
	const override = config?.navigation?.supportsGeo;
	if (typeof override === "boolean") {
		return override;
	}
	if (typeof override === "function") {
		return override();
	}
	return supportsGeoProtocol();
}

function resolveAddress(
	feature: MapsightUiFeature,
	config: PlaceActionsConfig | undefined,
): string | null {
	const address = config?.navigation?.address;
	if (typeof address === "function") {
		return asNonEmptyString(address(feature));
	}
	return asNonEmptyString(address);
}

function builtInNavHref(
	id: "geo" | "google" | "apple",
	lon: number | null,
	lat: number | null,
	address: string | null,
): string | null {
	if (lon != null && lat != null) {
		if (id === "geo") {
			return `geo:${lat},${lon}`;
		}
		if (id === "google") {
			return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
		}
		return `https://maps.apple.com/?daddr=${lat},${lon}`;
	}
	if (!address) {
		return null;
	}
	const query = encodeURIComponent(address);
	if (id === "geo") {
		return `geo:0,0?q=${query}`;
	}
	if (id === "google") {
		return `https://www.google.com/maps/dir/?api=1&destination=${query}`;
	}
	return `https://maps.apple.com/?daddr=${query}`;
}

function builtInNavLabel(id: "geo" | "google" | "apple"): string {
	return translate(`ui.place-actions.navigate.${id}`);
}

function isCustomNavTarget(target: unknown): target is CustomNavTarget {
	return (
		typeof target === "object" &&
		target != null &&
		"id" in target &&
		"label" in target &&
		"href" in target
	);
}

function resolveNavTargets(
	feature: MapsightUiFeature,
	config: PlaceActionsConfig | undefined,
): ResolvedNavTarget[] {
	const fromGeometry = config?.navigation?.fromGeometry !== false;
	const coords = fromGeometry ? lonLatFromGeometry(feature) : null;
	const lon = coords?.lon ?? null;
	const lat = coords?.lat ?? null;
	const address = resolveAddress(feature, config);
	if (lon == null && lat == null && !address) {
		return [];
	}

	const configured = config?.navigation?.targets ?? DEFAULT_NAV_TARGETS;
	const targets: ResolvedNavTarget[] = [];

	for (const target of configured) {
		if (target === "geo" || target === "google" || target === "apple") {
			if (target === "geo" && !geoProtocolSupported(config)) {
				continue;
			}
			const href = builtInNavHref(target, lon, lat, address);
			if (!href) {
				continue;
			}
			targets.push({
				id: target,
				label: builtInNavLabel(target),
				href,
			});
			continue;
		}
		if (!isCustomNavTarget(target)) {
			continue;
		}
		const href =
			typeof target.href === "function"
				? target.href({feature, lon, lat, address})
				: target.href;
		const resolvedHref = asNonEmptyString(href ?? null);
		const label = asNonEmptyString(target.label);
		const id = asNonEmptyString(target.id);
		if (!resolvedHref || !label || !id) {
			continue;
		}
		targets.push({id, label, href: resolvedHref});
	}

	return targets;
}

function telHref(telephone: string): string {
	const compact = telephone.replace(/[^\d+]/g, "");
	return `tel:${compact || telephone}`;
}

function resolveShare(
	feature: MapsightUiFeature,
	config: PlaceActionsConfig | undefined,
	ctx: PlaceActionsResolveContext,
): SharePlaceAction | null {
	const href = resolvePermalink(feature, config, ctx);
	if (!href) {
		return null;
	}
	return {
		kind: "share",
		href,
		title: resolveShareTitle(feature, config),
	};
}

function resolveNavigate(
	feature: MapsightUiFeature,
	config: PlaceActionsConfig | undefined,
): NavigatePlaceAction | null {
	const targets = resolveNavTargets(feature, config);
	if (targets.length === 0) {
		return null;
	}
	return {kind: "navigate", targets};
}

function resolveWebsite(
	feature: MapsightUiFeature,
	config: PlaceActionsConfig | undefined,
): WebsitePlaceAction | null {
	const schema = resolveFeatureSchema(feature, config);
	const href = asHttpOrHttpsUrl(schema.url);
	if (!href) {
		return null;
	}
	return {kind: "website", href};
}

function resolveCall(
	feature: MapsightUiFeature,
	config: PlaceActionsConfig | undefined,
): CallPlaceAction | null {
	const schema = resolveFeatureSchema(feature, config);
	const telephone = asNonEmptyString(schema.telephone);
	if (!telephone) {
		return null;
	}
	return {
		kind: "call",
		href: telHref(telephone),
		telephone,
	};
}

export function resolvePlaceActions(
	feature: MapsightUiFeature,
	config: PlaceActionsConfig = {},
): PlaceAction[] {
	const ctx: PlaceActionsResolveContext = {
		location: currentLocation(config),
	};
	const actions: PlaceAction[] = [];
	const share = resolveShare(feature, config, ctx);
	if (share) {
		actions.push(share);
	}
	const navigate = resolveNavigate(feature, config);
	if (navigate) {
		actions.push(navigate);
	}
	const website = resolveWebsite(feature, config);
	if (website) {
		actions.push(website);
	}
	const call = resolveCall(feature, config);
	if (call) {
		actions.push(call);
	}
	return actions;
}
