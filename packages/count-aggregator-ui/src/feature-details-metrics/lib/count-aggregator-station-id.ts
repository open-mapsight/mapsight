/** Prefix added to smart-city geojson feature ids for store uniqueness. */
export const MAPSIGHT_SMART_CITY_FEATURE_ID_PREFIX = "msp-";

/**
 * Strip mapsight feature id prefix before calling count-aggregator endpoints.
 */
export function toCountAggregatorStationId(stationId: string): string {
	return stationId.startsWith(MAPSIGHT_SMART_CITY_FEATURE_ID_PREFIX)
		? stationId.slice(MAPSIGHT_SMART_CITY_FEATURE_ID_PREFIX.length)
		: stationId;
}
