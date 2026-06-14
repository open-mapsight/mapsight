import {endpoints} from "./generated/client.js";
import {
	type FetchClientOptions,
	createFetchClient,
} from "./lib/fetch-client.js";

export type CountAggregatorClient = ReturnType<
	typeof createCountAggregatorClient
>;

export function createCountAggregatorClient(
	baseUrl: string,
	options?: FetchClientOptions,
) {
	return createFetchClient(baseUrl, endpoints, options);
}
