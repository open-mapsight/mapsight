import type {Connect, PreviewServer, ViteDevServer} from "vite";

import {createCountAggregatorMockMiddleware} from "./count-aggregator-mock/mock-api.ts";

function useCountAggregatorMock(middlewares: Connect.Server): void {
	middlewares.use(createCountAggregatorMockMiddleware());
}

export function countAggregatorMockPlugin() {
	return {
		name: "count-aggregator-mock-api",
		configureServer(server: ViteDevServer) {
			useCountAggregatorMock(server.middlewares);
		},
		configurePreviewServer(server: PreviewServer) {
			useCountAggregatorMock(server.middlewares);
		},
	};
}
