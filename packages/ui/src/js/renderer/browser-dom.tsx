import {createRoot, hydrateRoot} from "react-dom/client";

import App from "../components/app";
import AppContext from "../components/helping/app-context";
import type {MapsightUiRenderer} from "../types";

/**
 * Browser renderer (DOM) with re-hydration
 */
const mapsightUiBrowserDomRenderer: MapsightUiRenderer = (
	container,
	props,
	hydrate = false,
) => {
	if (!container) return;

	const app = (
		<AppContext {...props}>
			<App />
		</AppContext>
	);

	const root = hydrate ? hydrateRoot(container, app) : createRoot(container);
	root.render(app);
};

export default mapsightUiBrowserDomRenderer;
