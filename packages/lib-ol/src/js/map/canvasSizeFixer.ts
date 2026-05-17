import type OlMap from "ol/Map";

/**
 * This updates the canvas size attribute (width/height) after composition.
 * This is used in combination with anchored viewport pattern to make panels
 * transition into the viewport possible without the map jumping around.
 *
 * @param map map
 */
export default function canvasSizeFixer(map: OlMap) {
	let canvases: Array<HTMLCanvasElement> = [];

	function updateCanvasSize() {
		const size = map.getSize();
		if (!size) {
			return;
		}

		const width = size[0] + "px";
		const height = size[1] + "px";

		canvases.forEach((canvas) => {
			if (
				canvas.style.width !== width ||
				canvas.style.height !== height
			) {
				canvas.style.width = width;
				canvas.style.height = height;
			}
		});
	}

	function updateTargetCanvases() {
		const targetElement = map.getTargetElement();
		if (targetElement) {
			canvases = Array.from(
				targetElement.querySelectorAll(".ol-viewport canvas"),
			);
		}
	}

	map.on("change:target", updateTargetCanvases);
	updateTargetCanvases();

	map.on("postcompose", updateCanvasSize);
}
