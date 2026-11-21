import {afterEach, describe, expect, it, vi} from "vitest";

import type {MapState} from "@/lib/map/types";
import {createHighlightTestMap} from "@/test/create-highlight-test-map";

// The controller mirrors view changes into the store throttled and
// asynchronously. Advance past both.
const SYNC_DELAY_MS = 400;

const cleanup: Array<() => void> = [];
afterEach(() => {
	vi.useRealTimers();
	cleanup.splice(0).forEach((fn) => fn());
});

function runtime() {
	vi.useFakeTimers();
	const context = createHighlightTestMap();
	cleanup.push(() => {
		context.map.dispose();
		context.target.remove();
	});
	const readView = () =>
		(context.store.getState().map as MapState).view as
			{zoom?: number; resolution?: number; rotation?: number} | undefined;
	const sync = () => vi.advanceTimersByTimeAsync(SYNC_DELAY_MS);
	return {...context, readView, sync};
}

describe("view state sync", () => {
	it("writes a rotation and resets it to exactly 0", async () => {
		const {map, readView, sync} = runtime();
		const view = map.getView();

		view.setRotation(0.5);
		await sync();
		expect(readView()?.rotation).toBe(0.5);

		view.setRotation(0);
		await sync();
		expect(readView()?.rotation).toBe(0);
	});

	it("writes zoom level 0 together with its resolution", async () => {
		const {map, readView, sync} = runtime();
		const view = map.getView();

		view.setZoom(5);
		await sync();
		expect(readView()?.zoom).toBe(5);

		view.setZoom(0);
		await sync();
		expect(readView()?.zoom).toBe(0);
		expect(readView()?.resolution).toBe(view.getResolution());
	});
});
