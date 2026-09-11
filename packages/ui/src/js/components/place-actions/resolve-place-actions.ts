import getFeatureProperty from "../../helpers/get-feature-property";
import {translate} from "../../helpers/i18n";
import {
	formatCoordinateSpellings,
	isMarkedPointFeature,
} from "../../plugins/browser/marked-point";
import {buildLinkMarkerShareHref} from "../../plugins/browser/share-position-link";
import type {MapsightUiFeature} from "../../types";
import {supportsGeoProtocol} from "./supports-geo-protocol";
import type {
	BuiltInNavTargetId,
	CallPlaceAction,
	CopyCoordsPlaceAction,
	CustomNavHref,
	CustomNavTarget,
	FeatureSchema,
	NavigatePlaceAction,
	PlaceAction,
	PlaceActionsConfig,
	PlaceActionsLocation,
	PlaceActionsResolveContext,
	ResolvedNavTarget,
	SharePlaceAction,
	ShowOnMapPlaceAction,
	WebsitePlaceAction,
} from "./types";

const DEFAULT_NAV_TARGETS = ["geo", "google", "apple"] as const;

function isBuiltInNavTargetId(target: unknown): target is BuiltInNavTargetId {
	return target === "geo" || target === "google" || target === "apple";
}
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

/** `[west, south, east, north]` from a GeoJSON 2D (4) or 3D (6) bbox. */
export function lonLatBbox(
	bbox: number[] | undefined,
): [number, number, number, number] | null {
	if (!bbox) {
		return null;
	}
	const west = bbox[0];
	const south = bbox[1];
	if (typeof west !== "number" || typeof south !== "number") {
		return null;
	}
	if (bbox.length === 4) {
		const east = bbox[2];
		const north = bbox[3];
		if (typeof east !== "number" || typeof north !== "number") {
			return null;
		}
		return [west, south, east, north];
	}
	if (bbox.length === 6) {
		const east = bbox[3];
		const north = bbox[4];
		if (typeof east !== "number" || typeof north !== "number") {
			return null;
		}
		return [west, south, east, north];
	}
	return null;
}

export function lonLatFromGeometry(
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
	const bbox = lonLatBbox(feature.bbox);
	if (bbox) {
		return {lon: (bbox[0] + bbox[2]) / 2, lat: (bbox[1] + bbox[3]) / 2};
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
	id: BuiltInNavTargetId,
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

function builtInNavLabel(id: BuiltInNavTargetId): string {
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

function resolveCustomNavHref(
	href: CustomNavHref | undefined,
	ctx: {
		feature: MapsightUiFeature;
		lon: number | null;
		lat: number | null;
		address: string | null;
	},
): string | null {
	if (href == null) {
		return null;
	}
	const value = typeof href === "function" ? href(ctx) : href;
	return asNonEmptyString(value ?? null);
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
		if (isBuiltInNavTargetId(target)) {
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
		const ctx = {feature, lon, lat, address};
		const resolvedHref = resolveCustomNavHref(target.href, ctx);
		const label = asNonEmptyString(target.label);
		const id = asNonEmptyString(target.id);
		if (!resolvedHref || !label || !id) {
			continue;
		}
		const originHref = resolveCustomNavHref(target.originHref, ctx);
		targets.push({
			id,
			label,
			href: resolvedHref,
			...(originHref ? {originHref} : {}),
		});
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

function resolveCopyCoords(
	feature: MapsightUiFeature,
	config: PlaceActionsConfig | undefined,
): CopyCoordsPlaceAction | null {
	if (config?.copyCoords === false) {
		return null;
	}
	const isLinkMarker = isMarkedPointFeature(feature);
	if (config?.copyCoords !== true && !isLinkMarker) {
		return null;
	}
	const coords = lonLatFromGeometry(feature);
	if (!coords) {
		return null;
	}
	return {
		kind: "copyCoords",
		text: formatCoordinateSpellings(coords.lat, coords.lon).text,
	};
}

function resolveShowOnMap(
	feature: MapsightUiFeature,
	config: PlaceActionsConfig | undefined,
): ShowOnMapPlaceAction | null {
	if (config?.showOnMap === false) {
		return null;
	}
	if (!lonLatFromGeometry(feature)) {
		return null;
	}
	return {kind: "showOnMap"};
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

export function resolveFeaturePermalink(
	feature: MapsightUiFeature,
	config: PlaceActionsConfig = {},
): string | null {
	return resolvePermalink(feature, config, {
		location: currentLocation(config),
	});
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
	const copyCoords = resolveCopyCoords(feature, config);
	if (copyCoords) {
		actions.push(copyCoords);
	}
	const showOnMap = resolveShowOnMap(feature, config);
	if (showOnMap) {
		actions.push(showOnMap);
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
