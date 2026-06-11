import App from "@mapsight/ui/components/app";

import {
	baseMapsightConfig,
	createOptions,
	styleFunction,
} from "../../combined-list/shared.tsx";
import {UiDemoShell} from "./ui-demo-shell.tsx";

export function CombinedListPage() {
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
