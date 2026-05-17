import type OlFeature from "ol/Feature";
import type OlMap from "ol/Map";
import type {Coordinate} from "ol/coordinate";
import * as events from "ol/events";
import type {EventsKey} from "ol/events";
import type Geometry from "ol/geom/Geometry";
import LineString from "ol/geom/LineString";
import type Point from "ol/geom/Point";
import Polygon from "ol/geom/Polygon";
import type {DrawEvent, Options} from "ol/interaction/Draw";
import OlDrawInteraction from "ol/interaction/Draw";
import * as sphere from "ol/sphere";
import type {StyleFunction} from "ol/style/Style";

import ensureFeatureId from "@mapsight/lib-ol/feature/ensureId";

import {formatArea} from "../../helpers/formatArea";
import {formatLength} from "../../helpers/formatLength";
import type {VectorFeatureSource} from "./VectorFeatureSource";

const defaultOptions = {
	type: "Point",
};

// FIXME: We monkey path some methods marked as private, that are not really private
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export default class DrawInteraction extends OlDrawInteraction {
	private _source: VectorFeatureSource | null = null;
	private _replacePrevious = false;
	private _clearOnStart = false;
	private _measure = false;
	private _sketchFeature: OlFeature | null = null;
	private _sketchPoint: OlFeature<Point> | null = null;
	private _sketchLine: OlFeature<LineString> | null = null;
	private _measureCoordinate: Coordinate | null = null;
	private _measureChangeListener: EventsKey | null = null;

	constructor(options: Options) {
		super({...defaultOptions, ...options});

		this.on("drawstart", this.handleSketchStart.bind(this));
		this.on("drawend", this.handleSketchEnd.bind(this));
	}

	abort() {
		// only need to abort if active
		if (this.getActive()) {
			// abort by quickly de- and then reactivating ol interaction
			this.setActive(false);
			this.setActive(true);
		}
	}

	/** @override */
	override updateSketchFeatures_(...args: unknown[]) {
		super["updateSketchFeatures_"].apply(this, args);
		this._sketchPoint = this["sketchPoint_"];
		this._sketchLine = this["sketchLine_"];
	}

	/** @override */
	override createOrUpdateSketchPoint_(...args: unknown[]) {
		super["createOrUpdateSketchPoint_"].apply(this, args);
		this._sketchPoint = this["sketchPoint_"];
	}

	handleSketchStart(startEvent: DrawEvent) {
		// set sketch
		this._sketchFeature = startEvent.feature;

		if (this._clearOnStart) {
			this._source?.clear();
		}
	}

	handleSketchEnd({feature}: {feature: OlFeature}) {
		// unset sketch
		this._sketchFeature = null;

		// save feature?
		if (this._source) {
			feature.set("measurementType", undefined);
			ensureFeatureId(feature);

			if (this._replacePrevious) {
				this._source.clear();
			}
			this._source.addFeature(feature);
		}
	}

	initMeasurement() {
		this._measureChangeListener = null;
		this._measureCoordinate = null;

		this.addEventListener("drawstart", (event) => {
			// TODO: Check that the event actually gives a coordinate!!!
			console.log(
				"TODO: Check that the event actually gives a coordinate!!!",
			);
			this.handleMeasurementStart(
				event as unknown as {coordinate: Coordinate},
			);
		});
		this.addEventListener("drawend", this.handleMeasurementEnd.bind(this));
	}

	updateMeasurementFeatures(label = "") {
		if (this._sketchFeature) {
			this._sketchFeature.set("measurementType", "drawFeature");
			this._sketchFeature.set("measurementLabel", label);
		}

		if (this._sketchPoint) {
			this._sketchPoint.set("measurementType", "drawPoint");
			this._sketchPoint.set("measurementLabel", label);
		}

		if (this._sketchLine) {
			this._sketchLine.set("measurementType", "drawLine");
			this._sketchLine.set("measurementLabel", label);
		}
	}

	handleMeasurementStart({coordinate}: {coordinate: Coordinate}) {
		this._measureCoordinate = coordinate;
		const sketchGeometry = this._sketchFeature?.getGeometry();
		if (sketchGeometry) {
			this._measureChangeListener = sketchGeometry.on(
				"change",
				this.handleMeasurementChange.bind(this),
			);
		}
		this.updateMeasurementFeatures();
	}

	handleMeasurementChange({target: geometry}: {target: Geometry}) {
		let output;
		if (geometry instanceof Polygon) {
			output = formatArea(sphere.getArea(geometry));
			this._measureCoordinate = geometry
				.getInteriorPoint()
				.getCoordinates();
		} else if (geometry instanceof LineString) {
			output = formatLength(sphere.getLength(geometry));
			this._measureCoordinate = geometry.getLastCoordinate();
		}

		this.updateMeasurementFeatures(output);
	}

	handleMeasurementEnd() {
		if (this._measureChangeListener) {
			events.unlistenByKey(this._measureChangeListener);
		}
	}

	/** @override */
	override setMap(map: OlMap) {
		super.setMap(map);

		this.initMeasurement();
	}

	getSource() {
		return this._source;
	}

	setSource(source: VectorFeatureSource | null) {
		this._source = source;
	}

	setMeasure(measure: boolean) {
		this._measure = measure;
	}

	getMeasure() {
		return this._measure;
	}

	setReplacePrevious(replacePrevious: boolean) {
		this._replacePrevious = replacePrevious;
	}

	getReplacePrevious() {
		return this._replacePrevious;
	}

	setClearOnStart(clearOnStart: boolean) {
		this._clearOnStart = clearOnStart;
	}

	getClearOnStart() {
		return this._clearOnStart;
	}

	getStyle() {
		return this["overlay_"].getStyle();
	}

	setStyle(styleFunction: StyleFunction) {
		this["overlay_"].setStyle(styleFunction);
	}
}
