/* From Modernizr */
import type OlMap from "ol/Map";

export type AnimateFunction = (deltaT: number) => void | boolean;

function hasTransitionEndEvent() {
	const el = document.createElement("fakeelement");
	return el.style.transition !== undefined;
}

function animationLoop(render: AnimateFunction) {
	let running = true;
	let lastFrame = +new Date();

	function loop(now: number) {
		// stop the loop if render returned false
		if (running) {
			window.requestAnimationFrame(loop);
			const deltaT = now - lastFrame;
			if (deltaT < 160) {
				running = render(deltaT) || running;
			}
			lastFrame = now;
		}
	}

	loop(lastFrame);
}

export default function animateDuringTransition(
	map: OlMap,
	render: AnimateFunction,
	maxTime = 10000,
) {
	const hasTransitionEvent = hasTransitionEndEvent();
	if (!hasTransitionEvent || !window.requestAnimationFrame) {
		return false;
	}

	const targetElement = map.getTargetElement();
	if (!targetElement) {
		return false;
	}

	let isTransitionRunning = true;
	const maxTimeTimeout = setTimeout(endAnimation, maxTime);

	function endAnimation() {
		isTransitionRunning = false;
		clearTimeout(maxTimeTimeout);
		targetElement.removeEventListener("transitionend", endAnimation);
	}

	animationLoop((deltaT) => render(deltaT) !== false && isTransitionRunning);
	targetElement.addEventListener("transitionend", endAnimation);

	return true;
}
