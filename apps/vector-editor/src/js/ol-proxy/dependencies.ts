// inject mapsight dependencies
import type {Definition} from "@mapsight/core/ol-proxy";
import {di} from "@mapsight/core/ol-proxy";
import GeoJSONFormat from "@mapsight/core/ol-proxy/definitions/format/GeoJSONFormat";
import DoubleClickZoomInteraction from "@mapsight/core/ol-proxy/definitions/interaction/DoubleClickZoomInteraction";
import DragPanInteraction from "@mapsight/core/ol-proxy/definitions/interaction/DragPanInteraction";
import DrawInteraction from "@mapsight/core/ol-proxy/definitions/interaction/DrawInteraction";
import KeyboardPanInteraction from "@mapsight/core/ol-proxy/definitions/interaction/KeyboardPanInteraction";
import KeyboardZoomInteraction from "@mapsight/core/ol-proxy/definitions/interaction/KeyboardZoomInteraction";
import ModifyInteraction from "@mapsight/core/ol-proxy/definitions/interaction/ModifyInteraction";
import MouseWheelZoomInteraction from "@mapsight/core/ol-proxy/definitions/interaction/MouseWheelZoomInteraction";
import PinchZoomInteraction from "@mapsight/core/ol-proxy/definitions/interaction/PinchZoomInteraction";
import SelectInteraction from "@mapsight/core/ol-proxy/definitions/interaction/SelectInteraction";
import TranslateInteraction from "@mapsight/core/ol-proxy/definitions/interaction/TranslateInteraction";
import TileLayer from "@mapsight/core/ol-proxy/definitions/layer/TileLayer";
import VectorLayer from "@mapsight/core/ol-proxy/definitions/layer/VectorLayer";
import VectorOverlayLayer from "@mapsight/core/ol-proxy/definitions/layer/VectorOverlayLayer";
import OSMSource from "@mapsight/core/ol-proxy/definitions/source/OsmSource";
import TileWMSSource from "@mapsight/core/ol-proxy/definitions/source/TileWMSSource";
import VectorFeatureSource from "@mapsight/core/ol-proxy/definitions/source/VectorFeatureSource";
import VectorSource from "@mapsight/core/ol-proxy/definitions/source/VectorSource";

di.injectDefinitions([
	// layer
	TileLayer,
	VectorLayer,
	VectorOverlayLayer,

	// source
	VectorSource,
	TileWMSSource,
	VectorFeatureSource,
	OSMSource,

	// format
	GeoJSONFormat,

	// interaction
	SelectInteraction,
	DragPanInteraction,
	DoubleClickZoomInteraction,
	PinchZoomInteraction,
	MouseWheelZoomInteraction,
	KeyboardPanInteraction,
	KeyboardZoomInteraction,
	DrawInteraction as Definition,
	ModifyInteraction as Definition,
	TranslateInteraction as Definition,
]);
