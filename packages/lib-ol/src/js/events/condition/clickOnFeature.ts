import type {MapBrowserEvent} from "ol";

/**
 * based on http://stackoverflow.com/questions/29396614/openlayers3-clicking-outside-feature-deselects-all-features
 *
 * @param e event
 * @returns return
 */
export default function clickOnFeature(e: MapBrowserEvent<PointerEvent>) {
	return (
		e.type === "click" && !!e.map.forEachFeatureAtPixel(e.pixel, () => true)
	);
}
