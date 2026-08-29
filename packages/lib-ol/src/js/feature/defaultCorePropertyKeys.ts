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
