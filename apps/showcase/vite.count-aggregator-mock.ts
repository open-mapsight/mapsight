import type {PreviewServer, ViteDevServer} from "vite";

import {createCountAggregatorMockMiddleware} from "./count-aggregator-mock/mock-api.ts";

export function countAggregatorMockPlugin() {
	const middleware = createCountAggregatorMockMiddleware();

	return {
		name: "count-aggregator-mock-api",
		configureServer(server: ViteDevServer) {
			server.middlewares.use(middleware);
		},
		configurePreviewServer(server: PreviewServer) {
			server.middlewares.use(middleware);
		},
	};
}
