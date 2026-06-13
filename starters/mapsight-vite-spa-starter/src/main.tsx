import "@mapsight/traffic-style/pictograms-fontawesome";

import {StrictMode} from "react";
import {createRoot} from "react-dom/client";

import {configureReactModalAppElement} from "@mapsight/ui/react-modal-app-element";

import {App} from "./app.tsx";

import "./scss/mapsight-spa.scss";

const rootElement = document.querySelector("#root");
if (!(rootElement instanceof HTMLElement)) {
	throw new Error("Mapsight SPA root element #root not found");
}

configureReactModalAppElement(rootElement);

createRoot(rootElement).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
