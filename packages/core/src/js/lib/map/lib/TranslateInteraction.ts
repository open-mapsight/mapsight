import Collection from "ol/Collection";
import type OlFeature from "ol/Feature";
import type {Options} from "ol/interaction/Translate";
import Translate from "ol/interaction/Translate";
import type {VectorSourceEvent} from "ol/source/Vector";
import VectorEventType from "ol/source/VectorEventType";

import type {VectorFeatureSource} from "@/lib/map/lib/VectorFeatureSource";

export default class TranslateInteraction extends Translate {
	private _source: VectorFeatureSource | null = null;
	private _featureCollection: Collection<OlFeature>;

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
				oldSource.removeEventListener(VectorEventType.ADDFEATURE, (e) =>
					this.handleSourceAdd(e as VectorSourceEvent),
				);
				oldSource.removeEventListener(VectorEventType.CLEAR, () =>
					this.removeAllFeatures(),
				);
				oldSource.removeEventListener(
					VectorEventType.REMOVEFEATURE,
					(e) => this.handleSourceRemove(e as VectorSourceEvent),
				);
			}
			this.removeAllFeatures();

			if (source) {
				source
					.getFeatures()
					.forEach((feature) => this.addFeature(feature));

				source.addEventListener(VectorEventType.ADDFEATURE, (e) =>
					this.handleSourceAdd(e as VectorSourceEvent),
				);
				source.addEventListener(VectorEventType.CLEAR, () =>
					this.removeAllFeatures(),
				);
				source.addEventListener(VectorEventType.REMOVEFEATURE, (e) =>
					this.handleSourceRemove(e as VectorSourceEvent),
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
