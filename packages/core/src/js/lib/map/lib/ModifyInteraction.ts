import Collection from "ol/Collection";
import type OlFeature from "ol/Feature";
import type {ModifyEvent, Options} from "ol/interaction/Modify";
import Modify from "ol/interaction/Modify";
import type {VectorSourceEvent} from "ol/source/Vector";
import type {StyleFunction} from "ol/style/Style";

import type {VectorFeatureSource} from "./VectorFeatureSource";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export default class ModifyInteraction extends Modify {
	private _source: VectorFeatureSource | null = null;
	private _featureCollection: Collection<OlFeature>;

	constructor(options: Options) {
		const featureCollection = new Collection<OlFeature>();

		super({
			...options,

			// The ol constructor requires a feature source or features collection to be passed to the constructor
			// we want to be able to change the source later on so we use a collection as a "buffer", an keep it synchronized.
			features: featureCollection,
			source: undefined,
		});

		this._featureCollection = featureCollection;
		this.addEventListener("modifyend", (e) =>
			this.handleModifyEnd(e as ModifyEvent),
		);
	}

	getSource() {
		return this._source;
	}

	setSource(source: VectorFeatureSource | null) {
		this._source = source;
	}

	handleSourceAdd({feature}: VectorSourceEvent) {
		this.addFeature(feature);
	}

	handleSourceRemove({feature}: VectorSourceEvent) {
		this.removeFeature(feature);
	}

	handleModifyEnd({features}: ModifyEvent) {
		if (this._source && features) {
			this._source.updateFeatures(features.getArray());
		}
	}

	addFeature(feature?: OlFeature) {
		if (feature) {
			this._featureCollection.push(feature);
		}
	}

	removeFeature(feature?: OlFeature) {
		if (feature) {
			this._featureCollection.remove(feature);
		}
	}

	removeAllFeatures() {
		this._featureCollection.forEach((feature) =>
			this.removeFeature(feature),
		);
	}

	getStyle() {
		return this["overlay_"].getStyle();
	}

	setStyle(styleFunction: StyleFunction) {
		this["overlay_"].setStyle(styleFunction);
	}
}
