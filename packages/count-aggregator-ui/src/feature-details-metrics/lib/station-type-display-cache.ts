import {
	type StationType,
	type StationTypeDisplay,
	createCountAggregatorClient,
	listStationTypes,
	resolveStationTypeDisplay,
} from "@mapsight/count-aggregator-api";

const stationTypesByBaseUrl = new Map<
	string,
	Promise<Map<StationType, StationTypeDisplay>>
>();

async function loadStationTypeDisplays(
	apiBaseUrl: string,
): Promise<Map<StationType, StationTypeDisplay>> {
	const client = createCountAggregatorClient(apiBaseUrl);
	const response = await listStationTypes(client);

	return new Map(
		response.data.map((entry) => [
			entry.type,
			resolveStationTypeDisplay(entry),
		]),
	);
}

export async function getStationTypeDisplay(
	apiBaseUrl: string,
	stationType: StationType,
): Promise<StationTypeDisplay | undefined> {
	let promise = stationTypesByBaseUrl.get(apiBaseUrl);

	if (promise === undefined) {
		promise = loadStationTypeDisplays(apiBaseUrl);
		stationTypesByBaseUrl.set(apiBaseUrl, promise);
	}

	const displays = await promise;
	return displays.get(stationType);
}

/** Test helper */
export function resetStationTypeDisplayCache(): void {
	stationTypesByBaseUrl.clear();
}
