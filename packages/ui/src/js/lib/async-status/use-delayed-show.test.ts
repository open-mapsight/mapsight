import {act, renderHook} from "@testing-library/react";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";

import {useDelayedShow} from "./use-delayed-show";

describe("useDelayedShow", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("returns false while active is true but delay has not elapsed", () => {
		const {result} = renderHook(() =>
			useDelayedShow(true, {delayMs: 300, minVisibleMs: 200}),
		);

		expect(result.current).toBe(false);

		act(() => {
			vi.advanceTimersByTime(299);
		});

		expect(result.current).toBe(false);
	});

	it("returns true after delayMs when still active", () => {
		const {result} = renderHook(() =>
			useDelayedShow(true, {delayMs: 300, minVisibleMs: 200}),
		);

		act(() => {
			vi.advanceTimersByTime(300);
		});

		expect(result.current).toBe(true);
	});

	it("never becomes true when active becomes false before delay", () => {
		const {result, rerender} = renderHook(
			({active}: {active: boolean}) =>
				useDelayedShow(active, {delayMs: 300, minVisibleMs: 200}),
			{initialProps: {active: true}},
		);

		act(() => {
			vi.advanceTimersByTime(100);
		});

		rerender({active: false});

		act(() => {
			vi.advanceTimersByTime(500);
		});

		expect(result.current).toBe(false);
	});

	it("keeps true briefly after active false due to minVisibleMs", () => {
		const {result, rerender} = renderHook(
			({active}: {active: boolean}) =>
				useDelayedShow(active, {delayMs: 300, minVisibleMs: 200}),
			{initialProps: {active: true}},
		);

		act(() => {
			vi.advanceTimersByTime(300);
		});

		expect(result.current).toBe(true);

		rerender({active: false});

		expect(result.current).toBe(true);

		act(() => {
			vi.advanceTimersByTime(199);
		});

		expect(result.current).toBe(true);

		act(() => {
			vi.advanceTimersByTime(1);
		});

		expect(result.current).toBe(false);
	});
});
