import App from "@mapsight/ui/components/app";
import Instance from "@mapsight/ui/components/instance";

import styleFunction from "@/generated/mapsight-vector-styles/demo";
import {baseMapsightConfig, createOptions} from "@/mapsight/map-config";

export function MapPage() {
	return (
		<section className="map-page">
			<h1>Mapsight map</h1>
			<div className="map-page__frame">
				<Instance
					baseMapsightConfig={baseMapsightConfig}
					createOptions={createOptions}
					styleFunction={styleFunction}
				>
					<App />
				</Instance>
			</div>
		</section>
	);
}
