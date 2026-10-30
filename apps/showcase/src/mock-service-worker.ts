/// <reference lib="webworker" />
import {resolveCountAggregatorMockRequest} from "./count-aggregator/mock-api.ts";

const worker = self as unknown as ServiceWorkerGlobalScope;

// Only synthesize the showcase mock API; never cache or intercept app assets.
worker.addEventListener("install", (event) => {
	event.waitUntil(worker.skipWaiting());
});
worker.addEventListener("activate", (event) => {
	event.waitUntil(worker.clients.claim());
});
worker.addEventListener("fetch", (event) => {
	const request = event.request;
	if (request.method !== "GET" && request.method !== "HEAD") return;
	if (new URL(request.url).origin !== worker.location.origin) return;
	const response = resolveCountAggregatorMockRequest(request.url);
	if (!response) return;
	event.respondWith(
		new Response(request.method === "HEAD" ? null : response.body, {
			status: response.status,
			headers: response.headers,
		}),
	);
});
