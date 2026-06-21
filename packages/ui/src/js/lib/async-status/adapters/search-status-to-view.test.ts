import {describe, expect, it} from "vitest";

import {
	SEARCH_STATUS_EMPTY,
	SEARCH_STATUS_ERROR,
	SEARCH_STATUS_FOUND,
	SEARCH_STATUS_INACTIVE,
	SEARCH_STATUS_LOADING,
	searchStatusToView,
} from "./search-status-to-view";

describe("searchStatusToView", () => {
	it("maps inactive search to idle success", () => {
		const view = searchStatusToView(SEARCH_STATUS_INACTIVE, undefined);
		expect(view.status).toBe("success");
		expect(view.fetchStatus).toBe("idle");
	});

	it("maps loading without results to pending fetch", () => {
		const view = searchStatusToView(SEARCH_STATUS_LOADING, []);
		expect(view.status).toBe("pending");
		expect(view.fetchStatus).toBe("fetching");
	});

	it("maps loading with stale results to success fetch", () => {
		const view = searchStatusToView(SEARCH_STATUS_LOADING, [{id: "1"}]);
		expect(view.status).toBe("success");
		expect(view.fetchStatus).toBe("fetching");
	});

	it("maps empty and error states", () => {
		expect(searchStatusToView(SEARCH_STATUS_EMPTY, []).status).toBe(
			"success",
		);
		expect(searchStatusToView(SEARCH_STATUS_ERROR, undefined).status).toBe(
			"error",
		);
		expect(
			searchStatusToView(SEARCH_STATUS_FOUND, [{id: "1"}]).data,
		).toEqual([{id: "1"}]);
	});
});
