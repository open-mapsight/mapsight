import {
	type Mock,
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";

import type {IconCache} from "./cache.ts";
import {
	RUNTIME_ICON_PLACEHOLDER_SRC,
	addRuntimeIconMapRenderCallback,
	bindRuntimeIconStyleFeatureScope,
	getRuntimeIconGeneration,
	mapsightRuntimeIcon,
	setRuntimeIconMapRenderCallback,
} from "./icon-style.ts";

type MockIconCache = {
	getCached: Mock;
	get: Mock;
};

function createPendingCache(): MockIconCache & IconCache {
	return {
		getCached: vi.fn(() => undefined),
		get: vi.fn(() =>
			Promise.resolve({
				dataUrl: "data:image/png;base64,generated",
			}),
		),
	} as MockIconCache & IconCache;
}

async function flushPendingGetResults(get: Mock) {
	await Promise.all(
		get.mock.results.map(
			(result: {value: Promise<unknown>}) => result.value,
		),
	);
}

async function flushDeferredRender(count = 4) {
	for (let i = 0; i < count; i += 1) {
		await Promise.resolve();
	}
	const schedule =
		typeof globalThis.requestAnimationFrame === "function"
			? globalThis.requestAnimationFrame.bind(globalThis)
			: (callback: () => void) => queueMicrotask(callback);
	await new Promise<void>((resolve) => {
		schedule(() => resolve());
	});
}

function createStyleScopeRegistry() {
	const hooks: Array<{
		enter: (feature: {changed: () => void}) => void;
		exit: () => void;
	}> = [];

	return {
		register(hook: (typeof hooks)[number] | null) {
			if (hook) {
				hooks.push(hook);
			}
		},
		enter(feature: {changed: () => void}) {
			for (const hook of hooks) {
				hook.enter(feature);
			}
		},
		exit() {
			for (const hook of hooks) {
				hook.exit();
			}
		},
	};
}

beforeEach(() => {
	setRuntimeIconMapRenderCallback(null);
});

afterEach(() => {
	setRuntimeIconMapRenderCallback(null);
});

describe("mapsightRuntimeIcon", () => {
	it("returns cached data URLs synchronously", () => {
		const cache = {
			getCached: vi.fn(() => ({
				dataUrl: "data:image/png;base64,cached",
			})),
			get: vi.fn(),
		} as MockIconCache & IconCache;

		const src = mapsightRuntimeIcon("museum", "default", cache);

		expect(src).toBe("data:image/png;base64,cached");
		expect(cache.get).not.toHaveBeenCalled();
	});

	it("returns placeholder and schedules cache generation", () => {
		const cache = createPendingCache();

		const src = mapsightRuntimeIcon("museum", "default", cache);

		expect(src).toBe(RUNTIME_ICON_PLACEHOLDER_SRC);
		expect(cache.get).toHaveBeenCalledWith("museum", "default");
	});

	it("accepts compact mapsightIconId values", () => {
		const cache = createPendingCache();

		mapsightRuntimeIcon("museum/#be123c", "default", cache);

		expect(cache.get).toHaveBeenCalledWith("museum/#be123c", "default");
	});
});

describe("notifyRuntimeIconChange", () => {
	it("calls changed on the feature that received a placeholder", async () => {
		const changed = vi.fn();
		const feature = {changed};
		const cache = createPendingCache();
		const scope = createStyleScopeRegistry();

		bindRuntimeIconStyleFeatureScope(scope.register);
		scope.enter(feature);
		mapsightRuntimeIcon("museum", "default", cache);
		scope.exit();

		expect(changed).not.toHaveBeenCalled();
		await cache.get.mock.results[0]?.value;
		expect(changed).toHaveBeenCalledTimes(1);
	});

	it("defers map render until after notify completes", async () => {
		const renderMap = vi.fn();
		setRuntimeIconMapRenderCallback(renderMap);
		const cache = createPendingCache();

		const generationBefore = getRuntimeIconGeneration();
		mapsightRuntimeIcon("museum", "default", cache);

		await flushDeferredRender();

		expect(getRuntimeIconGeneration()).toBe(generationBefore + 1);
		expect(renderMap).toHaveBeenCalledTimes(1);
	});

	it("coalesces multiple notifies into one deferred render", async () => {
		const renderMap = vi.fn();
		setRuntimeIconMapRenderCallback(renderMap);
		const cache = createPendingCache();

		const generationBefore = getRuntimeIconGeneration();
		mapsightRuntimeIcon("museum", "default", cache);
		mapsightRuntimeIcon("museum", "small", cache);

		await flushDeferredRender();

		expect(getRuntimeIconGeneration()).toBe(generationBefore + 2);
		expect(renderMap).toHaveBeenCalledTimes(1);
	});
});

describe("multiple map instances", () => {
	it("renders every registered map callback", async () => {
		const renderMapA = vi.fn();
		const renderMapB = vi.fn();
		const removeA = addRuntimeIconMapRenderCallback(renderMapA);
		const removeB = addRuntimeIconMapRenderCallback(renderMapB);
		const cache = createPendingCache();

		mapsightRuntimeIcon("museum", "default", cache);
		await flushDeferredRender();

		expect(renderMapA).toHaveBeenCalledTimes(1);
		expect(renderMapB).toHaveBeenCalledTimes(1);

		removeA();
		removeB();
	});

	it("stops rendering a map after its callback is removed", async () => {
		const renderMapA = vi.fn();
		const renderMapB = vi.fn();
		const removeA = addRuntimeIconMapRenderCallback(renderMapA);
		addRuntimeIconMapRenderCallback(renderMapB);
		const cache = createPendingCache();

		removeA();
		mapsightRuntimeIcon("museum", "default", cache);
		await flushDeferredRender();

		expect(renderMapA).not.toHaveBeenCalled();
		expect(renderMapB).toHaveBeenCalledTimes(1);
	});

	it("coalesces one deferred render for multiple maps", async () => {
		const renderMapA = vi.fn();
		const renderMapB = vi.fn();
		addRuntimeIconMapRenderCallback(renderMapA);
		addRuntimeIconMapRenderCallback(renderMapB);
		const cache = createPendingCache();

		mapsightRuntimeIcon("museum", "default", cache);
		mapsightRuntimeIcon("museum", "small", cache);
		await flushDeferredRender();

		expect(renderMapA).toHaveBeenCalledTimes(1);
		expect(renderMapB).toHaveBeenCalledTimes(1);
	});
});

describe("multiple style functions", () => {
	it("notifies each feature for its own pending icon", async () => {
		const changedA = vi.fn();
		const changedB = vi.fn();
		const featureA = {changed: changedA};
		const featureB = {changed: changedB};
		const cache = createPendingCache();
		const scope = createStyleScopeRegistry();

		bindRuntimeIconStyleFeatureScope(scope.register);

		scope.enter(featureA);
		mapsightRuntimeIcon("museum", "default", cache);
		scope.exit();

		scope.enter(featureB);
		mapsightRuntimeIcon("stau", "default", cache);
		scope.exit();

		await flushPendingGetResults(cache.get);

		expect(changedA).toHaveBeenCalledTimes(1);
		expect(changedB).toHaveBeenCalledTimes(1);
	});

	it("supports separate style scope bindings", async () => {
		const changed = vi.fn();
		const feature = {changed};
		const cache = createPendingCache();
		const scopeA = createStyleScopeRegistry();
		const scopeB = createStyleScopeRegistry();

		bindRuntimeIconStyleFeatureScope(scopeA.register);
		bindRuntimeIconStyleFeatureScope(scopeB.register);

		for (const scope of [scopeA, scopeB]) {
			scope.enter(feature);
		}
		mapsightRuntimeIcon("museum", "default", cache);
		for (const scope of [scopeA, scopeB]) {
			scope.exit();
		}

		await cache.get.mock.results[0]?.value;

		expect(changed).toHaveBeenCalledTimes(1);
	});

	it("tracks pending icons independently per style function variant", async () => {
		const changed = vi.fn();
		const feature = {changed};
		const cache = createPendingCache();
		const defaultStyle = createStyleScopeRegistry();
		const smallStyle = createStyleScopeRegistry();

		bindRuntimeIconStyleFeatureScope(defaultStyle.register);
		bindRuntimeIconStyleFeatureScope(smallStyle.register);

		defaultStyle.enter(feature);
		mapsightRuntimeIcon("museum", "default", cache);
		defaultStyle.exit();

		smallStyle.enter(feature);
		mapsightRuntimeIcon("museum", "small", cache);
		smallStyle.exit();

		expect(cache.get).toHaveBeenCalledWith("museum", "default");
		expect(cache.get).toHaveBeenCalledWith("museum", "small");
		await flushPendingGetResults(cache.get);
		expect(changed).toHaveBeenCalledTimes(2);
	});
});
