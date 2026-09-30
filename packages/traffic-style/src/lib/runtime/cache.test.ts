import {beforeEach, describe, expect, it, vi} from "vitest";

import {IconCache} from "./cache.ts";

const {renderIconBitmapMock} = vi.hoisted(() => ({
	renderIconBitmapMock: vi.fn(),
}));

vi.mock("../icon/render.ts", () => ({
	renderIconBitmap: renderIconBitmapMock,
}));

const renderedIcon = {
	dataUrl: "data:image/png;base64,icon",
	width: 48,
	height: 64,
	logicalWidth: 24,
	logicalHeight: 32,
	pixelRatio: 2,
};

function deferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (reason?: unknown) => void;
	const promise = new Promise<T>((promiseResolve, promiseReject) => {
		resolve = promiseResolve;
		reject = promiseReject;
	});
	return {promise, resolve, reject};
}

describe("IconCache", () => {
	beforeEach(() => {
		renderIconBitmapMock.mockReset();
		renderIconBitmapMock.mockResolvedValue(renderedIcon);
	});

	it("returns cached bitmaps and records hits and misses", async () => {
		const cache = new IconCache();

		const first = await cache.get("museum");
		const second = await cache.get("museum");

		expect(second).toBe(first);
		expect(renderIconBitmapMock).toHaveBeenCalledOnce();
		expect(cache.has("museum")).toBe(true);
		expect(cache.getCached("museum")).toBe(first);
		expect(cache.getStats()).toEqual({
			size: 1,
			hits: 1,
			misses: 1,
			inFlight: 0,
		});
	});

	it("deduplicates concurrent requests for the same icon", async () => {
		const pendingRender = deferred<typeof renderedIcon>();
		renderIconBitmapMock.mockReturnValueOnce(pendingRender.promise);
		const cache = new IconCache();

		const first = cache.get("museum");
		const second = cache.get("museum");

		expect(renderIconBitmapMock).toHaveBeenCalledOnce();
		expect(cache.getStats()).toEqual({
			size: 0,
			hits: 0,
			misses: 1,
			inFlight: 1,
		});

		pendingRender.resolve(renderedIcon);

		await expect(Promise.all([first, second])).resolves.toEqual([
			expect.objectContaining(renderedIcon),
			expect.objectContaining(renderedIcon),
		]);
		expect(cache.getStats()).toEqual({
			size: 1,
			hits: 0,
			misses: 1,
			inFlight: 0,
		});
	});

	it("uses separate cache entries for each variant", async () => {
		const cache = new IconCache();

		await cache.get("museum", "default");
		await cache.get("museum", "small");

		expect(renderIconBitmapMock).toHaveBeenCalledTimes(2);
		expect(cache.has("museum", "default")).toBe(true);
		expect(cache.has("museum", "small")).toBe(true);
		expect(cache.getStats()).toMatchObject({size: 2, misses: 2});
	});

	it("ignores invalid icon ids without affecting stats", async () => {
		const cache = new IconCache();

		await expect(cache.get("   ")).resolves.toBeNull();

		expect(renderIconBitmapMock).not.toHaveBeenCalled();
		expect(cache.getStats()).toEqual({
			size: 0,
			hits: 0,
			misses: 0,
			inFlight: 0,
		});
	});

	it("clears rejected requests so they can be retried", async () => {
		renderIconBitmapMock
			.mockRejectedValueOnce(new Error("render failed"))
			.mockResolvedValueOnce(renderedIcon);
		const cache = new IconCache();

		await expect(cache.get("museum")).rejects.toThrow("render failed");
		expect(cache.getStats()).toMatchObject({
			size: 0,
			misses: 1,
			inFlight: 0,
		});

		await expect(cache.get("museum")).resolves.toEqual(
			expect.objectContaining(renderedIcon),
		);
		expect(renderIconBitmapMock).toHaveBeenCalledTimes(2);
		expect(cache.getStats()).toMatchObject({
			size: 1,
			misses: 2,
			inFlight: 0,
		});
	});

	it("evicts the least recently used entry", async () => {
		const cache = new IconCache({max: 2});

		await cache.get("museum");
		await cache.get("restaurant");
		expect(cache.getCached("museum")).toBeDefined();
		await cache.get("hospital");

		expect(cache.has("museum")).toBe(true);
		expect(cache.has("restaurant")).toBe(false);
		expect(cache.has("hospital")).toBe(true);
		expect(cache.getStats()).toMatchObject({size: 2, misses: 3});
	});
});
