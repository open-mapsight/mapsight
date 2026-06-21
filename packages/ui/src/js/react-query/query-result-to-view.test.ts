import {describe, expect, it} from "vitest";

import {queryResultToView} from "./query-result-to-view";

describe("queryResultToView", () => {
	it("maps pending fetching query to loading view", () => {
		const view = queryResultToView({
			status: "pending",
			fetchStatus: "fetching",
			data: undefined,
			error: null,
			isPlaceholderData: false,
			refetch: () => Promise.resolve({} as never),
		});

		expect(view.status).toBe("pending");
		expect(view.fetchStatus).toBe("fetching");
		expect(view.data).toBeUndefined();
		expect(view.refetch).toBeTypeOf("function");
	});

	it("maps success query with data", () => {
		const view = queryResultToView({
			status: "success",
			fetchStatus: "idle",
			data: [{id: "1"}],
			error: null,
			isPlaceholderData: false,
			refetch: undefined,
		});

		expect(view.status).toBe("success");
		expect(view.data).toEqual([{id: "1"}]);
	});

	it("maps error query", () => {
		const view = queryResultToView({
			status: "error",
			fetchStatus: "idle",
			data: undefined,
			error: new Error("boom"),
			isPlaceholderData: false,
			refetch: undefined,
		});

		expect(view.status).toBe("error");
		expect(view.error).toEqual(new Error("boom"));
	});

	it("maps refetching success query", () => {
		const view = queryResultToView({
			status: "success",
			fetchStatus: "fetching",
			data: [{id: "1"}],
			error: null,
			isPlaceholderData: true,
			refetch: undefined,
		});

		expect(view.status).toBe("success");
		expect(view.fetchStatus).toBe("fetching");
		expect(view.isPlaceholderData).toBe(true);
	});
});
