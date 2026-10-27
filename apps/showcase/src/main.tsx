import "@mapsight/traffic-style/pictograms-fontawesome";

import {StrictMode} from "react";
import {createRoot} from "react-dom/client";

import {App} from "./app.tsx";
import {registerStaticMock} from "./count-aggregator/register-static-mock.ts";

try {
	await Promise.race([
		registerStaticMock(),
		new Promise((_, reject) =>
			setTimeout(
				() => reject(new Error("Mock API initialization timed out")),
				10_000,
			),
		),
	]);
} catch (error) {
	console.error("Could not initialize the showcase mock API", error);
}

createRoot(document.querySelector("#root")!).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
