import {createRoot} from "react-dom/client";

import {createMapsightStore} from "@mapsight/core";
import {setAll} from "@mapsight/core/lib/base/actions";
import {FeatureSelectionsController} from "@mapsight/core/lib/feature-selections/controller";
import {FeatureSourcesController} from "@mapsight/core/lib/feature-sources/controller";
import {ListController} from "@mapsight/core/lib/list/controller";
import {MapController} from "@mapsight/core/lib/map/controller";
import EditorMixin from "@mapsight/core/mixins/EditorMixin";

import styleFunction from "../generated/mapsight-vector-styles/vector-style";

// TODO: Check why this does not work in libs.js
import "./ol-proxy/dependencies.ts";

import VectorEditor from "./components/VectorEditor.tsx";
import baseConfig from "./mapsight-config/base.ts";
import {
	getInitialData,
	getMapsightIconId,
	setup,
} from "./modules/vis-adapter.ts";

const mapController = new MapController("map");
mapController.setStyleFunction(styleFunction);

const store = createMapsightStore(
	{
		map: mapController,
		featureSources: new FeatureSourcesController("featureSources"),
		featureSelections: new FeatureSelectionsController("featureSelections"),
		list: new ListController("list"),
	},
	undefined,
	{
		...baseConfig,

		map: {
			...baseConfig.map,
			layers: {
				...baseConfig.map.layers,
				context: {
					type: "VectorLayer",
					options: {
						visible: true,
						style: "context",
						opacity: 0.6,
						renderBuffer: 200,
						selections: [],
						source: {
							type: "VectorFeatureSource",
							options: {
								featureSourceId: "context",
								featureSourcesControllerName: "featureSources",
								keepFeaturesInViewSelections: [],
								fitFeaturesInViewSelections: [],
								canAnimate: false,
								canCluster: false,
								useSelectionOverlay: false,
								featureSelections: [],
							},
						},
					},
				},
			},
		},

		featureSources: {
			context: {},
		},

		list: {
			featureSource: "vectorEditorData",
			featureSelectionHighlight: "highlight",
			featureSelectionSelect: "select",
		},
	},
);
const editor = new EditorMixin(store, "vectorEditor", {
	displayStyle: {
		style: "features",
		mapsightIconId: getMapsightIconId() || "ort",
		isTemporaryRestriction: false,
	},
	drawStyle: "drawMeasure",
	measure: {
		active: false,
		keepLabel: true,
	},
	modify: {
		active: false,
	},
	enableHistory: true,
	data: getInitialData(),
});

setup(editor);

editor.store.dispatch(
	setAll(
		[
			editor.controllers.map!,
			"layers",
			editor.ids.layer!,
			"options",
			"source",
			"options",
		],
		{
			keepFeaturesInViewSelections: [],
			fitFeaturesInViewSelections: [],
		},
	),
);

const container = window.document.getElementById("ms3-vector-editor");
if (container) {
	const root = createRoot(container);
	root.render(<VectorEditor editor={editor} />);
}
