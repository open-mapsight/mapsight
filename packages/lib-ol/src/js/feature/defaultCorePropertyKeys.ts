/**
 * Style / identity keys that `modifyFeature` applies on an OpenLayers feature.
 * Taken from simplestyle, traffic-style `attr()` / selectors, and live
 * feature-source data (`mapsightIconId`, `markerCaption*`, occupancy).
 *
 * UI-only keys (`description`, `tagGroups`, `listInformation`, …) stay on the
 * existing feature; Redux / GeoJSON remains the source of truth for those.
 */
export const DEFAULT_CORE_PROPERTY_KEYS: ReadonlySet<string> = new Set([
	"id",
	"name",
	"title",
	"type",
	"state",
	"cluster",
	"clusterSize",
	"mapsightIconId",
	"markerCaption",
	"markerCaptionColor",
	"markerCaptionHalo",
	"marker-size",
	"marker-color",
	"marker-symbol",
	"stroke",
	"stroke-width",
	"stroke-opacity",
	"fill",
	"fill-opacity",
	"chargingPower",
	"occupancyTrendString",
]);

/**
 * Union the slice-1 default set with compiled `allowedProps` (top-level keys).
 * `false` / missing / empty means “style may hash everything” — that must not
 * copy every GeoJSON key on modify.
 */
export function corePropertyKeysFromAllowedProps(
	allowedProps?: ReadonlyArray<string> | false,
): ReadonlySet<string> {
	if (!allowedProps || allowedProps.length === 0) {
		return DEFAULT_CORE_PROPERTY_KEYS;
	}

	const keys = new Set(DEFAULT_CORE_PROPERTY_KEYS);
	for (const key of allowedProps) {
		if (key) {
			keys.add(key);
		}
	}
	return keys;
}

export function corePropertyKeysEqual(
	left: ReadonlySet<string>,
	right: ReadonlySet<string>,
): boolean {
	if (left === right) {
		return true;
	}
	if (left.size !== right.size) {
		return false;
	}
	for (const key of left) {
		if (!right.has(key)) {
			return false;
		}
	}
	return true;
}
