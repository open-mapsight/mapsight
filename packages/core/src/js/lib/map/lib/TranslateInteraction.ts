import Collection from "ol/Collection";
import type OlFeature from "ol/Feature";
import type BaseEvent from "ol/events/Event";
import type {Options} from "ol/interaction/Translate";
import Translate from "ol/interaction/Translate";
import type {VectorSourceEvent} from "ol/source/Vector";
import VectorEventType from "ol/source/VectorEventType";

import type {VectorFeatureSource} from "@/lib/map/lib/VectorFeatureSource";

export default class TranslateInteraction extends Translate {
	private _source: VectorFeatureSource | null = null;
	private _featureCollection: Collection<OlFeature>;
	private _boundSourceAdd = (event: Event | BaseEvent) =>
		this.handleSourceAdd(event as VectorSourceEvent);
	private _boundSourceRemove = (event: Event | BaseEvent) =>
		this.handleSourceRemove(event as VectorSourceEvent);
	private _boundSourceClear = () => this.removeAllFeatures();

	constructor(options: Options) {
		const featureCollection = new Collection<OlFeature>();

		super({
			...options,

			// The ol constructor requires a feature source or features collection to be passed to the constructor
			// we want to be able to change the source later on so we use a collection as a "buffer", an keep it synchronized.
			features: featureCollection,
		});

		this._featureCollection = featureCollection;

		this.on("translateend", (e) => this.handleTranslateEnd(e));
	}

	getSource() {
		return this._source;
	}

	setSource(source: VectorFeatureSource | null) {
		const oldSource = this._source;
		this._source = source;

		if (source !== oldSource) {
			if (oldSource) {
				oldSource.removeEventListener(
					VectorEventType.ADDFEATURE,
					this._boundSourceAdd,
				);
				oldSource.removeEventListener(
					VectorEventType.CLEAR,
					this._boundSourceClear,
				);
				oldSource.removeEventListener(
					VectorEventType.REMOVEFEATURE,
					this._boundSourceRemove,
				);
			}
			this.removeAllFeatures();

			if (source) {
				source
					.getFeatures()
					.forEach((feature) => this.addFeature(feature));

				source.addEventListener(
					VectorEventType.ADDFEATURE,
					this._boundSourceAdd,
				);
				source.addEventListener(
					VectorEventType.CLEAR,
					this._boundSourceClear,
				);
				source.addEventListener(
					VectorEventType.REMOVEFEATURE,
					this._boundSourceRemove,
				);
			}
		}
	}

	handleSourceAdd({feature}: VectorSourceEvent) {
		if (feature) this.addFeature(feature);
	}

	handleSourceRemove({feature}: VectorSourceEvent) {
		if (feature) this.removeFeature(feature);
	}

	addFeature(feature: OlFeature) {
		if (feature) {
			this._featureCollection.push(feature);
		}
	}

	removeFeature(feature: OlFeature) {
		if (feature) {
			this._featureCollection.remove(feature);
		}
	}

	removeAllFeatures() {
		this._featureCollection.forEach((feature) =>
			this.removeFeature(feature),
		);
	}

	handleTranslateEnd({features}: {features: Collection<OlFeature>}) {
		if (this._source && features) {
			this._source.updateFeatures(features.getArray());
		}
	}
}
