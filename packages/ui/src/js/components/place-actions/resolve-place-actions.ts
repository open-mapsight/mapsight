import {
	resolveFeaturePermalink,
	resolveFeatureSchema,
} from "../../feature-permalink";
import {formatCoordinateSpellings} from "../../helpers/coordinates";
import {lonLatFromGeometry} from "../../helpers/geo";
import {supportsGeoProtocol} from "../../helpers/geo-protocol";
import getFeatureProperty from "../../helpers/get-feature-property";
import {translate} from "../../helpers/i18n";
import {isMarkedPointFeature} from "../../plugins/browser/marked-point";
import type {MapsightUiFeature} from "../../types";
import type {
	BuiltInNavTargetId,
	CallPlaceAction,
	CopyCoordsPlaceAction,
	CustomNavHref,
	CustomNavTarget,
	NavigatePlaceAction,
	PlaceAction,
	PlaceActionsConfig,
	ResolvedNavTarget,
	SharePlaceAction,
	ShowOnMapPlaceAction,
	WebsitePlaceAction,
} from "./types";

export {
	resolveFeaturePermalink,
	resolveFeatureSchema,
} from "../../feature-permalink";
export {lonLatBbox, lonLatFromGeometry} from "../../helpers/geo";

const DEFAULT_NAV_TARGETS = ["geo", "google", "apple"] as const;

function isBuiltInNavTargetId(target: unknown): target is BuiltInNavTargetId {
	return target === "geo" || target === "google" || target === "apple";
}

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
): SharePlaceAction | null {
	const href = resolveFeaturePermalink(feature, config);
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

export function resolvePlaceActions(
	feature: MapsightUiFeature,
	config: PlaceActionsConfig = {},
): PlaceAction[] {
	const actions: PlaceAction[] = [];
	const share = resolveShare(feature, config);
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
