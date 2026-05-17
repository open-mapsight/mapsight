import type {Description} from "@mapsight/core/ol-proxy";

const INTERACTIONS: Record<string, Description> = {
	DragPan: {
		type: "DragPanInteraction",
		options: {kinetic: [-0.005, 0.05, 100]},
	},
	PinchZoom: {type: "PinchZoomInteraction"},
	DoubleClickZoom: {type: "DoubleClickZoomInteraction"},
	MouseWheelZoom: {type: "MouseWheelZoomInteraction"},
	KeyboardPan: {type: "KeyboardPanInteraction"},
	KeyboardZoom: {type: "KeyboardZoomInteraction"},
};

export default INTERACTIONS;
