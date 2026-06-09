import {describe, expect, it, vi} from "vitest";

import {
	HIGHLIGHT_TEST_FEATURE_ID,
	centerPixel,
	createHighlightTestMap,
	dispatchPointerMoveAtPixel,
	getHighlightFeatures,
} from "@/test/create-highlight-test-map";

const HOVER_DISPATCH_DELAY_MS = 10;

async function flushHoverDispatch() {
	await vi.advanceTimersByTimeAsync(HOVER_DISPATCH_DELAY_MS + 5);
}

describe("highlight on mouseover", () => {
	it("selects and deselects highlight in redux when pointer leaves the feature", async () => {
		vi.useFakeTimers();

		let hitMode: "feature" | "empty" = "empty";
		const {store, map} = createHighlightTestMap({
			getHitMode: () => hitMode,
		});
		const pixel = centerPixel(map);

		hitMode = "feature";
		dispatchPointerMoveAtPixel(map, pixel);
		await flushHoverDispatch();
		expect(getHighlightFeatures(store)).toEqual([
			HIGHLIGHT_TEST_FEATURE_ID,
		]);

		hitMode = "empty";
		dispatchPointerMoveAtPixel(map, pixel);
		await flushHoverDispatch();
		expect(getHighlightFeatures(store)).toEqual([]);

		vi.useRealTimers();
	});

	it("clears highlight after a second pointermove off the feature", async () => {
		vi.useFakeTimers();

		let hitMode: "feature" | "empty" = "feature";
		const {store, map} = createHighlightTestMap({
			getHitMode: () => hitMode,
		});
		const pixel = centerPixel(map);
		const emptyPixel: [number, number] = [8, 8];

		hitMode = "feature";
		dispatchPointerMoveAtPixel(map, pixel);
		await flushHoverDispatch();
		expect(getHighlightFeatures(store)).toEqual([
			HIGHLIGHT_TEST_FEATURE_ID,
		]);

		hitMode = "empty";
		dispatchPointerMoveAtPixel(map, emptyPixel);
		dispatchPointerMoveAtPixel(map, emptyPixel);
		await flushHoverDispatch();
		expect(getHighlightFeatures(store)).toEqual([]);

		vi.useRealTimers();
	});

	it("keeps highlight when pointer re-enters before a brief miss deselect would fire", async () => {
		vi.useFakeTimers();

		let hitMode: "feature" | "empty" = "feature";
		const {store, map} = createHighlightTestMap({
			getHitMode: () => hitMode,
		});
		const pixel = centerPixel(map);

		// Hover feature — select scheduled for t+10ms.
		dispatchPointerMoveAtPixel(map, pixel);

		// Brief miss (e.g. hit tolerance gap) — deselect scheduled for t+12ms.
		hitMode = "empty";
		await vi.advanceTimersByTimeAsync(2);
		dispatchPointerMoveAtPixel(map, pixel);

		// Back on feature before deselect runs — select scheduled for t+15ms.
		hitMode = "feature";
		await vi.advanceTimersByTimeAsync(3);
		dispatchPointerMoveAtPixel(map, pixel);

		// Re-entry select fires (earlier scheduled actions were cancelled).
		await vi.advanceTimersByTimeAsync(10);
		expect(getHighlightFeatures(store)).toEqual([
			HIGHLIGHT_TEST_FEATURE_ID,
		]);

		// Brief-miss deselect was cancelled when pointer re-entered the feature.
		await vi.advanceTimersByTimeAsync(5);
		expect(getHighlightFeatures(store)).toEqual([
			HIGHLIGHT_TEST_FEATURE_ID,
		]);

		vi.useRealTimers();
	});
});
