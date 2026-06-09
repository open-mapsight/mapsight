import {di} from "@/ol-proxy";
import GeoJSONFormat from "@/ol-proxy/definitions/format/GeoJSONFormat";
import DoubleClickZoomInteraction from "@/ol-proxy/definitions/interaction/DoubleClickZoomInteraction";
import DragPanInteraction from "@/ol-proxy/definitions/interaction/DragPanInteraction";
import KeyboardPanInteraction from "@/ol-proxy/definitions/interaction/KeyboardPanInteraction";
import KeyboardZoomInteraction from "@/ol-proxy/definitions/interaction/KeyboardZoomInteraction";
import MouseWheelZoomInteraction from "@/ol-proxy/definitions/interaction/MouseWheelZoomInteraction";
import PinchZoomInteraction from "@/ol-proxy/definitions/interaction/PinchZoomInteraction";
import SelectInteraction from "@/ol-proxy/definitions/interaction/SelectInteraction";
import TileLayer from "@/ol-proxy/definitions/layer/TileLayer";
import VectorLayer from "@/ol-proxy/definitions/layer/VectorLayer";
import VectorOverlayLayer from "@/ol-proxy/definitions/layer/VectorOverlayLayer";
import OSMSource from "@/ol-proxy/definitions/source/OsmSource";
import TileWMSSource from "@/ol-proxy/definitions/source/TileWMSSource";
import VectorFeatureSource from "@/ol-proxy/definitions/source/VectorFeatureSource";
import VectorSource from "@/ol-proxy/definitions/source/VectorSource";

di.injectDefinitions([
	TileLayer,
	VectorLayer,
	VectorOverlayLayer,
	VectorSource,
	TileWMSSource,
	OSMSource,
	VectorFeatureSource,
	GeoJSONFormat,
	SelectInteraction,
	DragPanInteraction,
	DoubleClickZoomInteraction,
	PinchZoomInteraction,
	MouseWheelZoomInteraction,
	KeyboardPanInteraction,
	KeyboardZoomInteraction,
]);
