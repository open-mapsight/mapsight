import Map from "@mapsight/ui/components/map";
import MapWrapper from "@mapsight/ui/components/map-wrapper";

import {
	baseMapsightConfig,
	createOptions,
	noopStyleFunction,
} from "../../ui-demos/simple-map-config.ts";
import {UiDemoShell} from "./ui-demo-shell.tsx";

export function SimpleMapPage() {
	return (
		<UiDemoShell
			baseMapsightConfig={baseMapsightConfig}
			createOptions={createOptions}
			styleFunction={noopStyleFunction}
			mergeDefaultPlugins={false}
		>
			<MapWrapper>
				<Map />
			</MapWrapper>
		</UiDemoShell>
	);
}
