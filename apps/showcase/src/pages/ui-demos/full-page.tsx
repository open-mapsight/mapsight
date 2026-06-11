import App from "@mapsight/ui/components/app";

import {
	baseMapsightConfig,
	createOptions,
	styleFunction,
} from "../../ui-demos/full-config.tsx";
import {UiDemoShell} from "./ui-demo-shell.tsx";

export function FullPage() {
	return (
		<UiDemoShell
			baseMapsightConfig={baseMapsightConfig}
			createOptions={createOptions}
			styleFunction={styleFunction}
		>
			<App />
		</UiDemoShell>
	);
}
