import type {IconVariant} from "../icon/icon-id.ts";
import type {IconCache} from "./cache.ts";
import {defaultIconCache} from "./cache.ts";
import {mapsightIconCacheKey} from "./icon-key.ts";

/** 1×1 transparent PNG used until rasterization completes. */
export const RUNTIME_ICON_PLACEHOLDER_SRC =
	"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+X2ZkAAAAASUVORK5CYII=";

type RuntimeIconFeature = {
	changed: () => void;
};

type StyleFeatureScopeHooks = {
	enter: (feature: RuntimeIconFeature) => void;
	exit: () => void;
};

let runtimeIconResolveCount = 0;
const runtimeIconListeners = new Set<() => void>();
const pendingFeaturesByCacheKey = new Map<string, Set<RuntimeIconFeature>>();
let activeStyleFeature: RuntimeIconFeature | null = null;
const mapRenderCallbacks = new Set<() => void>();
let pendingMapRender = false;

export function getRuntimeIconGeneration() {
	return runtimeIconResolveCount;
}

export function onRuntimeIconChange(listener: () => void): () => void {
	runtimeIconListeners.add(listener);
	return () => {
		runtimeIconListeners.delete(listener);
	};
}

/** Register a map render callback for one map instance. */
export function addRuntimeIconMapRenderCallback(
	callback: () => void,
): () => void {
	mapRenderCallbacks.add(callback);
	return () => {
		mapRenderCallbacks.delete(callback);
	};
}

/** Replace all map render callbacks with a single callback. */
export function setRuntimeIconMapRenderCallback(callback: (() => void) | null) {
	mapRenderCallbacks.clear();
	if (callback) {
		mapRenderCallbacks.add(callback);
	}
}

export function bindRuntimeIconStyleFeatureScope(
	setHooks: (hooks: StyleFeatureScopeHooks | null) => void,
) {
	setHooks({
		enter(feature) {
			activeStyleFeature = feature;
		},
		exit() {
			activeStyleFeature = null;
		},
	});
}

function scheduleMapRender() {
	if (mapRenderCallbacks.size === 0 || pendingMapRender) {
		return;
	}

	pendingMapRender = true;
	queueMicrotask(() => {
		pendingMapRender = false;
		const schedule =
			typeof globalThis.requestAnimationFrame === "function"
				? globalThis.requestAnimationFrame.bind(globalThis)
				: (callback: () => void) => queueMicrotask(callback);
		schedule(() => {
			for (const callback of mapRenderCallbacks) {
				callback();
			}
		});
	});
}

function registerPendingFeature(cacheKey: string, feature: RuntimeIconFeature) {
	let features = pendingFeaturesByCacheKey.get(cacheKey);
	if (!features) {
		features = new Set();
		pendingFeaturesByCacheKey.set(cacheKey, features);
	}

	features.add(feature);
}

function notifyIconResolved(cacheKey: string) {
	const features = pendingFeaturesByCacheKey.get(cacheKey);
	if (features) {
		for (const feature of features) {
			feature.changed();
		}
		pendingFeaturesByCacheKey.delete(cacheKey);
	}

	runtimeIconResolveCount += 1;
	for (const listener of runtimeIconListeners) {
		listener();
	}
	scheduleMapRender();
}

/**
 * Style-function entry point: returns a placeholder immediately and triggers a
 * map re-render once rasterization finishes.
 */
export function mapsightRuntimeIcon(
	mapsightIconId: unknown,
	variant?: IconVariant,
	cache: IconCache = defaultIconCache,
) {
	if (typeof mapsightIconId !== "string" || !mapsightIconId.trim()) {
		return RUNTIME_ICON_PLACEHOLDER_SRC;
	}

	const trimmed = mapsightIconId.trim();
	const cacheKey = mapsightIconCacheKey(trimmed, variant);

	const cached = cache.getCached(trimmed, variant);
	if (cached) {
		return cached.dataUrl;
	}

	const feature = activeStyleFeature;
	if (feature) {
		registerPendingFeature(cacheKey, feature);
	}

	void cache.get(trimmed, variant).then(() => {
		notifyIconResolved(cacheKey);
	});

	return RUNTIME_ICON_PLACEHOLDER_SRC;
}
