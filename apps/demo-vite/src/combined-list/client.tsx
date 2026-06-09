import {createRoot} from "react-dom/client";

import App from "@mapsight/ui/components/app";
import Instance from "@mapsight/ui/components/instance";
import createDefaultPlugins from "@mapsight/ui/plugins/browser-defaults";

import {baseMapsightConfig, createOptions, styleFunction} from "./shared";

createOptions.plugins = [
	...createDefaultPlugins(),
	...(createOptions.plugins || []),
];

const root = createRoot(document.querySelector("#root")!);
root.render(
	<Instance
		baseMapsightConfig={baseMapsightConfig}
		styleFunction={styleFunction}
		createOptions={createOptions}
	>
		<App />
	</Instance>,
);
