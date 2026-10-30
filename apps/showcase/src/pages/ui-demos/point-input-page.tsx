import {useEffect, useId} from "react";
import {useSelector} from "react-redux";

import App from "@mapsight/ui/components/app";
import PointInputControls from "@mapsight/ui/components/point-input";
import * as config from "@mapsight/ui/config";
import {metaData, osm} from "@mapsight/ui/config/map/layers";
import createDefaultPlugins from "@mapsight/ui/plugins/browser-defaults";
import {configureReactModalAppElement} from "@mapsight/ui/react-modal-app-element";
import type {CreateOptions} from "@mapsight/ui/types";

import type {FeatureSourceState} from "@mapsight/core/lib/feature-sources/types";
import EditorMixin from "@mapsight/core/mixins/EditorMixin";
import type {Definition} from "@mapsight/core/ol-proxy";
import {di} from "@mapsight/core/ol-proxy";
import DrawInteraction from "@mapsight/core/ol-proxy/definitions/interaction/DrawInteraction";
import ModifyInteraction from "@mapsight/core/ol-proxy/definitions/interaction/ModifyInteraction";
import TranslateInteraction from "@mapsight/core/ol-proxy/definitions/interaction/TranslateInteraction";

import styleFunction from "../../generated/mapsight-vector-styles/demo.js";
import {osmTileUrl} from "../../osm-tile-url.ts";
import {UiDemoShell} from "./ui-demo-shell.tsx";

const EDITOR = "pointInput";
const SOURCE_ID = `${EDITOR}_featureSource`;

const baseMapsightConfig = config.map(
	{
		osm: osm(
			osmTileUrl,
			true,
			metaData(
				"OSM",
				'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende',
				true,
				false,
				true,
				"Karte",
			),
		),
	},
	config.mapView(
		config.mapViewCenter(1171479, 6848253),
		config.mapViewExtent(1097392, 6789091, 1240635, 6895797),
		15,
		10,
		18,
	),
);

const createOptions: CreateOptions = {
	plugins: [
		...createDefaultPlugins(),
		[
			"pointEditor",
			{
				// A single-point editor; pointer clicks and the keyboard
				// controls write to the same feature source.
				afterCreate({store}) {
					if (!store) return;
					di.injectDefinitions([
						DrawInteraction as Definition,
						ModifyInteraction as Definition,
						TranslateInteraction as Definition,
					]);
					new EditorMixin(store, EDITOR, {
						displayStyle: "pointInput",
						drawStyle: "draw",
						draw: {
							active: true,
							type: "Point",
							replacePrevious: true,
						},
					});
				},
			},
		],
	],
	imagesUrl: "/img/",
	components: {
		MapOverlayTopRight: () => (
			<PointInputControls featureSourceId={SOURCE_ID} />
		),
	},
	uiState: {
		map: {show: true},
		list: {show: false},
	},
};

/** What a host form observer would store for this editor. */
function StoredValue() {
	const headingId = useId();
	const data = useSelector(
		(state: {featureSources?: Record<string, FeatureSourceState>}) =>
			state.featureSources?.[SOURCE_ID]?.data,
	);
	const features = data?.features ?? [];
	return (
		<section
			aria-labelledby={headingId}
			className="point-input-demo__value"
		>
			<h2 id={headingId}>Stored value</h2>
			<p>
				The editor source after a click or keyboard confirmation, as a
				host form field would receive it.
			</p>
			<pre>
				{features.length
					? JSON.stringify(data, null, 2)
					: "No point set yet."}
			</pre>
		</section>
	);
}

export function PointInputPage() {
	useEffect(() => configureReactModalAppElement("#root"), []);
	return (
		<UiDemoShell
			baseMapsightConfig={baseMapsightConfig}
			createOptions={createOptions}
			styleFunction={styleFunction}
			mergeDefaultPlugins={false}
		>
			<App />
			<StoredValue />
		</UiDemoShell>
	);
}
