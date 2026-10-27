import type {IncomingMessage, ServerResponse} from "node:http";

import {
	type MockHttpResponse,
	resolveCountAggregatorMockRequest,
} from "../src/count-aggregator/mock-api.ts";

export function writeMockHttpResponse(
	res: ServerResponse,
	mock: MockHttpResponse,
): void {
	for (const [key, value] of Object.entries(mock.headers)) {
		res.setHeader(key, value);
	}

	res.statusCode = mock.status;
	res.end(mock.body);
}

export function createCountAggregatorMockMiddleware(): (
	req: IncomingMessage,
	res: ServerResponse,
	next: () => void,
) => void {
	return (req, res, next) => {
		if (req.method !== "GET" && req.method !== "HEAD") {
			next();
			return;
		}

		const requestUrl = req.url ?? "/";
		const mock = resolveCountAggregatorMockRequest(requestUrl);

		if (mock === null) {
			next();
			return;
		}

		if (req.method === "HEAD") {
			res.statusCode = mock.status;
			for (const [key, value] of Object.entries(mock.headers)) {
				res.setHeader(key, value);
			}
			res.end();
			return;
		}

		writeMockHttpResponse(res, mock);
	};
}
