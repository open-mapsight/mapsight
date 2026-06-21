import {describe, expect, it} from "vitest";

import {resolveAsyncStatusDisplay} from "./resolve-display-phase";
import type {AsyncStatusView} from "./types";

const baseView: AsyncStatusView = {
	status: "success",
	fetchStatus: "idle",
	data: undefined,
	error: undefined,
};

describe("resolveAsyncStatusDisplay", () => {
	it("shows hidden then loading for pending+fetching with delayed show", () => {
		const view: AsyncStatusView = {
			...baseView,
			status: "pending",
			fetchStatus: "fetching",
		};

		expect(
			resolveAsyncStatusDisplay(view, false, {delayMs: 300}).phase,
		).toBe("hidden");
		expect(
			resolveAsyncStatusDisplay(view, true, {delayMs: 300}).phase,
		).toBe("loading");
	});

	it("shows error immediately without waiting for delay", () => {
		const view: AsyncStatusView = {
			...baseView,
			status: "error",
			fetchStatus: "idle",
			error: "boom",
		};

		expect(
			resolveAsyncStatusDisplay(view, false, {delayMs: 300}).phase,
		).toBe("error");
	});

	it("shows empty for success with empty data", () => {
		const view: AsyncStatusView = {
			...baseView,
			status: "success",
			data: {features: []},
		};

		expect(
			resolveAsyncStatusDisplay(view, false, {
				isEmpty: () => true,
			}).phase,
		).toBe("empty");
	});

	it("shows refreshing for success with data while fetching", () => {
		const view: AsyncStatusView = {
			...baseView,
			status: "success",
			fetchStatus: "fetching",
			data: {features: [{id: "1"}]},
		};

		const result = resolveAsyncStatusDisplay(view, false);

		expect(result.phase).toBe("refreshing");
		expect(result.showRefreshing).toBe(true);
	});

	it("uses banner mode for error with stale data by default", () => {
		const view: AsyncStatusView = {
			...baseView,
			status: "error",
			fetchStatus: "idle",
			data: {features: [{id: "1"}]},
			error: "boom",
		};

		const banner = resolveAsyncStatusDisplay(view, false, {
			errorWithStaleData: "banner",
		});
		expect(banner.phase).toBe("refreshing");
		expect(banner.showError).toBe(true);

		const replace = resolveAsyncStatusDisplay(view, false, {
			errorWithStaleData: "replace",
		});
		expect(replace.phase).toBe("error");
	});
});
