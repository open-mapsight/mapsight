import {renderToString} from "react-dom/server";

import App from "../components/app";
import AppContext from "../components/helping/app-context";
import type {MapsightUiRenderer} from "../types";

/*
 * Server side renderer for Node.js (renders a string)
 */
const mapsightUiServerStringRenderer: MapsightUiRenderer<string> = (_, props) =>
	renderToString(
		<AppContext {...props}>
			<App />
		</AppContext>,
	);

export default mapsightUiServerStringRenderer;
