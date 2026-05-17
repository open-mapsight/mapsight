export default {
	map: {
		interactions: {
			DragPan: {
				type: "DragPanInteraction",
				options: {kinetic: [-0.005, 0.05, 100]},
			},
			PinchZoom: {type: "PinchZoomInteraction"},
			DoubleClickZoom: {type: "DoubleClickZoomInteraction"},
			MouseWheelZoom: {type: "MouseWheelZoomInteraction"},
			KeyboardPan: {type: "KeyboardPanInteraction"},
			KeyboardZoom: {type: "KeyboardZoomInteraction"},
		},
		view: {
			center: [980402, 6996893],
			extent: [
				231663.72727762, 5671953.1189511, 2083274.3002, 7760824.2276377,
			],
			zoom: 13,
			minZoom: 5,
			maxZoom: 20,
		},
		moveTolerance: 2,
		featureInteractions: {
			mouseover: {
				selection: "mouseover",
				options: {
					main: true,
					cursor: "pointer",
					hitTolerance: 5,
				},
			},
			mousedown: {
				selection: "mousedown",
				options: {
					main: true,
					deselectUncontrolled: ["select"],
					hitTolerance: 5,
					shift: {
						selectExclusively: false,
						deselectUncontrolled: null,
					},
				},
			},
			touch: {
				selection: "touch",
				options: {
					deselectUncontrolled: ["select"],
					hitTolerance: 5,
				},
			},
		},
		layers: {
			osm: {
				type: "TileLayer",
				metaData: {
					title: "OpenStreetMap",
					attribution:
						'Karte: &copy; <a href="https://www.openstreetmap.org/copyright" rel="external">OpenStreetMap-Mitwirkende </a>',
					visibleInLayerSwitcher: false,
					isBaseLayer: true,
				},
				options: {
					source: {
						type: "OsmSource",
						options: {
							url:
								import.meta.env.VITE_BASE_LAYER_URL ||
								"/osm-tiles/{z}/{x}/{y}.png",
						},
					},
					visible: true,
				},
			},
		},
	},
	featureSources: {},
	featureSelections: {select: {}, highlight: {}},
};
