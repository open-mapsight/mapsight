import ReactDOM from "react-dom";

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
	ReactDOM[hydrate ? "hydrate" : "render"](
		<AppContext {...props}>
			<App />
		</AppContext>,
		container,
	);
};

export default mapsightUiBrowserDomRenderer;
