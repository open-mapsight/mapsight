import type OlMap from "ol/Map";

export function getMotionPreference(): MediaQueryList | undefined {
	return typeof window !== "undefined" &&
		typeof window.matchMedia === "function"
		? window.matchMedia("(prefers-reduced-motion: reduce)")
		: undefined;
}

/** Read at execution time, including animations queued before the preference changed. */
export default function runWithMotionPreference(
	map: OlMap,
	animate: (reducedMotion: boolean) => void,
): () => void {
	const media = getMotionPreference();
	const view = map.getView();
	if (media?.matches) view.cancelAnimations();
	animate(media?.matches ?? false);
	if (!media || !view.getAnimating()) return () => {};

	let disposed = false;
	const cleanup = () => {
		if (disposed) return;
		disposed = true;
		media.removeEventListener("change", onPreference);
		view.un("change", onViewChange);
		map.un("change:target", onTargetChange);
		map.un("change:view", cleanup);
	};
	const onPreference = () => {
		if (!media.matches) return;
		cleanup();
		view.cancelAnimations();
		animate(true);
	};
	const onViewChange = () => {
		if (!view.getAnimating()) cleanup();
	};
	const onTargetChange = () => {
		if (!map.getTargetElement()) cleanup();
	};
	media.addEventListener("change", onPreference);
	view.on("change", onViewChange);
	map.on("change:target", onTargetChange);
	map.on("change:view", cleanup);
	return cleanup;
}
