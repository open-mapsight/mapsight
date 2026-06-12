import type {z} from "zod";

export interface EndpointParameter {
	name: string;
	type: "Path" | "Query" | "Body" | "Header";
	schema: z.ZodTypeAny;
}

export interface EndpointDefinition {
	method: "get";
	path: string;
	alias: string;
	parameters?: readonly EndpointParameter[];
	response: z.ZodTypeAny;
}

export interface FetchClientOptions {
	fetch?: typeof fetch;
	headers?: Readonly<Record<string, string>>;
}

export class CountAggregatorApiError extends Error {
	readonly status: number;
	readonly url: string;

	constructor(message: string, status: number, url: string) {
		super(message);
		this.name = "CountAggregatorApiError";
		this.status = status;
		this.url = url;
	}
}

function buildRequestUrl(
	baseUrl: string,
	pathTemplate: string,
	params: Readonly<Record<string, unknown>> = {},
	queries: Readonly<Record<string, unknown>> = {},
): string {
	let path = pathTemplate;

	for (const [key, value] of Object.entries(params)) {
		path = path.replace(`:${key}`, encodeURIComponent(String(value)));
	}

	const searchParams = new URLSearchParams();
	for (const [key, value] of Object.entries(queries)) {
		if (value !== undefined && value !== null) {
			searchParams.set(key, String(value));
		}
	}

	const queryString = searchParams.toString();
	const normalizedBase = baseUrl.replace(/\/$/, "");
	const normalizedPath = path.startsWith("/") ? path : `/${path}`;

	return queryString
		? `${normalizedBase}${normalizedPath}?${queryString}`
		: `${normalizedBase}${normalizedPath}`;
}

type EndpointCallArgs = {
	params?: Record<string, unknown>;
	queries?: Record<string, unknown>;
};

export type FetchClient<E extends readonly EndpointDefinition[]> = {
	[K in E[number]["alias"]]: (args?: EndpointCallArgs) => Promise<unknown>;
};

export function createFetchClient<E extends readonly EndpointDefinition[]>(
	baseUrl: string,
	endpoints: E,
	options: FetchClientOptions = {},
): FetchClient<E> {
	const fetchFn = options.fetch ?? globalThis.fetch;
	const defaultHeaders = options.headers ?? {};
	const client = {} as FetchClient<E>;

	for (const endpoint of endpoints) {
		const caller = async (args: EndpointCallArgs = {}) => {
			const url = buildRequestUrl(
				baseUrl,
				endpoint.path,
				args.params,
				args.queries,
			);

			const response = await fetchFn(url, {
				method: endpoint.method.toUpperCase(),
				headers: {
					Accept: "application/json",
					...defaultHeaders,
				},
			});

			if (!response.ok) {
				throw new CountAggregatorApiError(
					`Request failed with HTTP ${response.status}`,
					response.status,
					url,
				);
			}

			const body: unknown = await response.json();
			return endpoint.response.parse(body);
		};

		Object.defineProperty(client, endpoint.alias, {
			value: caller,
			enumerable: true,
			configurable: false,
			writable: false,
		});
	}

	return client;
}
