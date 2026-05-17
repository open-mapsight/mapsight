import type OlMap from "ol/Map";

export default function updateSizeOnTransitionEnd(map: OlMap) {
	let previousTargetElement: undefined | HTMLElement;

	function updateSize() {
		map.updateSize();
	}

	function addEventListener() {
		const targetElement = map.getTargetElement();

		if (previousTargetElement) {
			previousTargetElement.removeEventListener(
				"transitionend",
				updateSize,
			);
		}

		if (targetElement) {
			targetElement.addEventListener("transitionend", updateSize);
		}
		previousTargetElement = targetElement;
	}

	map.on("change:target", addEventListener);
	addEventListener();
}
