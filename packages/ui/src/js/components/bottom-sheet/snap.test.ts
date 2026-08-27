import {describe, expect, it} from "vitest";

import {
	clampDragHeight,
	nearestSnapHeight,
	resolveSnapAfterDrag,
	snapIndexForHeight,
} from "./snap";

const snaps = [100, 200, 400, 600];

describe("bottom-sheet snap helpers", () => {
	it("finds nearest snap and index", () => {
		expect(nearestSnapHeight(230, snaps)).toBe(200);
		expect(snapIndexForHeight(230, snaps)).toBe(1);
		expect(snapIndexForHeight(500, snaps)).toBe(2);
	});

	it("clamps drag height to snap range", () => {
		expect(clampDragHeight(50, snaps)).toBe(100);
		expect(clampDragHeight(900, snaps)).toBe(600);
		expect(clampDragHeight(350, snaps)).toBe(350);
	});

	it("resolves the next snap past the midpoint in the drag direction", () => {
		expect(resolveSnapAfterDrag(310, 200, snaps)).toBe(400);
		expect(resolveSnapAfterDrag(290, 200, snaps)).toBe(200);
		expect(resolveSnapAfterDrag(140, 200, snaps)).toBe(100);
	});
});
