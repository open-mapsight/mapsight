import {createRoot} from "react-dom/client";

import {createMapsightStore} from "@mapsight/core";
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

		list: {
			featureSource: "vectorEditorData",
			featureSelectionHighlight: "highlight",
			featureSelectionSelect: "select",
		},
	},
);

const editor = new EditorMixin(store, "vectorEditor");

const container = window.document.getElementById("ms3-share-link");
if (container) {
	const root = createRoot(container);
	root.render(<VectorEditor editor={editor} />);
}
