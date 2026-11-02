/* eslint-disable n/no-unsupported-features/node-builtins -- Browser Service Workers use the browser navigator API. */
// eslint-disable-next-line import-x/default -- Vite's worker URL query provides the default export.
import mockServiceWorkerUrl from "../mock-service-worker.ts?worker&url";

/** Production builds keep JSON queries and CSV exports functional on static hosting. */
export async function registerStaticMock(): Promise<void> {
	if (import.meta.env.DEV || !("serviceWorker" in window.navigator)) return;
	await window.navigator.serviceWorker.register(mockServiceWorkerUrl, {
		scope: import.meta.env.BASE_URL,
		updateViaCache: "none",
	});
	await window.navigator.serviceWorker.ready;
	if (!window.navigator.serviceWorker.controller) {
		await new Promise<void>((resolve) => {
			window.navigator.serviceWorker.addEventListener(
				"controllerchange",
				() => resolve(),
				{once: true},
			);
		});
	}
}
