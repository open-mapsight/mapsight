import type OlMap from "ol/Map";
import type View from "ol/View";
import {type Animation, isNoopAnimation} from "ol/View";

export function getMotionPreference(): MediaQueryList | undefined {
	return typeof window !== "undefined" &&
		typeof window.matchMedia === "function"
		? window.matchMedia("(prefers-reduced-motion: reduce)")
		: undefined;
}

// OL exposes no finish-one-series API. Isolate the version-sensitive queue
// access here and cover it with real View/Map regressions. Retiming the actual
// steps keeps OL's computed fit targets, anchors, constraints and callbacks;
// cancel-and-retry would lose them and cancel unrelated work on the same view.
// Returns undefined if an OL upgrade changed these internals; callers then only
// apply the preference at execution time instead of breaking navigation.
function animationSeries(view: View): Animation[][] | undefined {
	const {animations_: queue, updateAnimations_: update} = view as unknown as {
		animations_?: unknown;
		updateAnimations_?: unknown;
	};
	if (!Array.isArray(queue) || typeof update !== "function") return undefined;
	return queue.filter((series): series is Animation[] =>
		Array.isArray(series),
	);
}

type Pending = {
	series: Set<Animation[]>;
	settle: () => void;
	cleanup: () => void;
};

const pending = new WeakMap<View, Pending>();

function watch(map: OlMap, media: MediaQueryList): Pending {
	const view = map.getView();
	const series = new Set<Animation[]>();
	let disposed = false;
	const cleanup = () => {
		if (disposed) return;
		disposed = true;
		media.removeEventListener("change", onPreference);
		view.un("change", onViewChange);
		map.un("change:target", onTargetChange);
		map.un("change:view", cleanup);
		pending.delete(view);
		series.clear();
	};
	const settle = () => {
		const current = new Set(animationSeries(view) ?? []);
		const active = [...series].filter((entry) => current.has(entry));
		// Finish in native completion order, retaining OL's newest-first update
		// order for ties. Already completed serial steps must not run again.
		const end = (entry: Animation[]) => {
			const last = entry.findLast((step) => !isNoopAnimation(step))!;
			return last.start + last.duration;
		};
		active.sort((left, right) => end(left) - end(right));
		const groups = Map.groupBy(active, end);
		cleanup();
		for (const group of groups.values()) {
			for (const entry of group) {
				for (const step of entry) {
					if (step.complete) continue;
					step.start = Date.now();
					step.duration = 0;
				}
			}
			view.updateAnimations_();
		}
	};
	const onPreference = () => {
		if (media.matches) settle();
	};
	const onViewChange = () => {
		for (const entry of series) {
			if (entry.every((step) => step.complete)) series.delete(entry);
		}
		if (!series.size || !view.getAnimating()) cleanup();
	};
	const onTargetChange = () => {
		if (!map.getTargetElement()) cleanup();
	};
	media.addEventListener("change", onPreference);
	view.on("change", onViewChange);
	map.on("change:target", onTargetChange);
	map.on("change:view", cleanup);
	const state = {series, settle, cleanup};
	pending.set(view, state);
	return state;
}

/** Read at execution time, including animations queued before the preference changed. */
export default function runWithMotionPreference(
	map: OlMap,
	animate: (reducedMotion: boolean) => void,
): () => void {
	const media = getMotionPreference();
	const view = map.getView();
	const reduced = media?.matches ?? false;
	if (reduced) pending.get(view)?.settle();
	const before = animationSeries(view);
	if (
		!media ||
		reduced ||
		!before ||
		typeof media.addEventListener !== "function" ||
		typeof media.removeEventListener !== "function"
	) {
		animate(reduced);
		return () => {};
	}
	const previous = new Set(before);
	animate(false);
	const entries = (animationSeries(view) ?? []).filter(
		(entry) => !previous.has(entry),
	);
	if (!entries.length) return () => {};
	const state = pending.get(view) ?? watch(map, media);
	for (const entry of entries) state.series.add(entry);
	return () => {
		for (const entry of entries) state.series.delete(entry);
		if (!state.series.size && pending.get(view) === state) state.cleanup();
	};
}
