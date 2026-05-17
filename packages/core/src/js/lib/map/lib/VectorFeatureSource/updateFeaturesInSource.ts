import type OlFeature from "ol/Feature";
import type VectorSource from "ol/source/Vector";

import {getOlFeatureId} from "@/lib/helpers/ol";

/**
 * Modifies the openlayers feature with the given properties.
 * Will trigger openlayers observe events when appropriate. Changes to geometry will trigger an change:geometry event otherwise
 * only one change event will be triggered if any of the props changed. Equality is checked strictly (===).
 * Does NOT remove old properties not defined in new props.
 *
 * TODO: Move to @mapsight/lib-ol?
 *
 * @param baseFeature base feature to modify
 * @param newProps properties to set
 * @returns true if changed, false otherwise
 */
function modifyFeature(
	baseFeature: OlFeature,
	newProps: Record<string, unknown>,
) {
	const oldProps = baseFeature.getProperties();

	// TODO: Should we remove old properties not existing in new properties?
	let featureChanged = false;
	Object.keys(newProps).forEach(function updateFeatureProperty(key) {
		const newValue = newProps[key];
		if (oldProps[key] !== newValue) {
			featureChanged = true;
			const silent = key !== "geometry";
			baseFeature.set(key, newValue, silent);
		}
	});

	if (featureChanged) {
		baseFeature.changed();
	}
	return featureChanged;
}

/**
 * Update the source with the given features, removing old or unidentifiable features, updating existing features if id matches
 * and adding new features. Will trigger openlayers observe events when appropriate.
 *
 * TODO: Move to @mapsight/lib-ol?
 *
 * @param source source to update
 * @param nextFeatures next features
 * @returns flags that indicate the what changes have occurred
 */
export function updateFeaturesInSource(
	source: VectorSource,
	nextFeatures: Array<OlFeature>,
) {
	const features = source.getFeatures();

	let hasChanged = false;
	let hasAdded = false;
	let hasRemoved = false;
	const ids = new Set<string>();
	features.forEach(function handlePreviousFeature(feature) {
		if (!feature) {
			return;
		}

		const id = getOlFeatureId(feature);
		if (id !== undefined) {
			ids.add(id);
		} else {
			// remove features without id
			source.removeFeature(feature);
			hasChanged = true;
			hasRemoved = true;
		}
	});

	nextFeatures.forEach(function updateFeatureInSource(nextFeature) {
		const newId = getOlFeatureId(nextFeature);
		if (newId !== undefined && ids.has(newId)) {
			ids.delete(newId);

			const prevFeature = source.getFeatureById(newId);
			if (prevFeature) {
				const hasFeatureChanged = modifyFeature(
					prevFeature,
					nextFeature.getProperties(),
				);
				if (hasFeatureChanged) {
					hasChanged = true;
				}
				return;
			}
		}

		hasChanged = true;
		hasAdded = true;

		// FIXME: We use a method marked as private, that is not really private
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		source.addFeatureInternal(nextFeature);
	});

	if (ids.size) {
		hasChanged = true;
		hasRemoved = true;

		for (const id of ids) {
			const oldFeature = source.getFeatureById(id);
			if (oldFeature) source.removeFeature(oldFeature);
		}
	}

	if (hasChanged) {
		source.changed();
	}

	return {changed: hasChanged, added: hasAdded, removed: hasRemoved};
}
