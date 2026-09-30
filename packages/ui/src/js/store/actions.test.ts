import {afterEach, describe, expect, it, vi} from "vitest";

import {
	FETCH_JSON_FAILURE,
	FETCH_JSON_REQUEST,
	FETCH_JSON_SUCCESS,
	FETCH_TEXT_FAILURE,
	FETCH_TEXT_REQUEST,
	FETCH_TEXT_SUCCESS,
	fetchJson,
	fetchText,
} from "./actions";

type TestAction = {type: string; key?: string; url?: string};

function createThunkHarness() {
	const app: Record<string, {url?: string; status?: string}> = {};
	const dispatch = vi.fn((action: TestAction) => {
		if (
			(action.type === FETCH_TEXT_REQUEST ||
				action.type === FETCH_JSON_REQUEST) &&
			action.key
		) {
			app[action.key] = {url: action.url, status: "loading"};
		}
		return action;
	});
	const getState = () => ({app}) as never;
	const actionsOfType = (type: string) =>
		dispatch.mock.calls
			.map(([action]) => action as TestAction & Record<string, unknown>)
			.filter((action) => action.type === type);
	return {app, dispatch, getState, actionsOfType};
}

function stubFetchResponse(status: number, body: string) {
	vi.stubGlobal(
		"fetch",
		vi.fn(() =>
			Promise.resolve({
				ok: status >= 200 && status < 300,
				status,
				text: () => Promise.resolve(body),
			}),
		),
	);
}

async function flushPromises() {
	await new Promise((resolve) => {
		setTimeout(resolve, 0);
	});
}

describe("fetchText", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it("dispatches success with the body of an ok response", async () => {
		stubFetchResponse(200, "<p>details</p>");
		const {dispatch, getState, actionsOfType} = createThunkHarness();

		fetchText("details", "/details.html")(dispatch, getState, undefined);
		await flushPromises();

		expect(actionsOfType(FETCH_TEXT_SUCCESS)).toEqual([
			expect.objectContaining({key: "details", data: "<p>details</p>"}),
		]);
		expect(actionsOfType(FETCH_TEXT_FAILURE)).toEqual([]);
	});

	it.each([404, 502])(
		"dispatches failure instead of success for HTTP %i",
		async (status) => {
			stubFetchResponse(status, "<html>error page</html>");
			const {dispatch, getState, actionsOfType} = createThunkHarness();

			fetchText("details", "/details.html")(
				dispatch,
				getState,
				undefined,
			);
			await flushPromises();

			expect(actionsOfType(FETCH_TEXT_SUCCESS)).toEqual([]);
			const failures = actionsOfType(FETCH_TEXT_FAILURE);
			expect(failures).toHaveLength(1);
			expect(failures[0]?.error).toEqual(new Error(`HTTP ${status}`));
		},
	);

	it("dispatches failure once with the network error", async () => {
		const networkError = new TypeError("Failed to fetch");
		vi.stubGlobal(
			"fetch",
			vi.fn(() => Promise.reject(networkError)),
		);
		const {dispatch, getState, actionsOfType} = createThunkHarness();

		fetchText("details", "/details.html")(dispatch, getState, undefined);
		await flushPromises();

		const failures = actionsOfType(FETCH_TEXT_FAILURE);
		expect(failures).toHaveLength(1);
		expect(failures[0]?.error).toBe(networkError);
	});

	it("discards the response when the url changed meanwhile", async () => {
		stubFetchResponse(404, "missing");
		const {app, dispatch, getState} = createThunkHarness();

		fetchText("details", "/old.html")(dispatch, getState, undefined);
		app.details = {url: "/new.html", status: "loading"};
		await flushPromises();

		expect(dispatch).toHaveBeenCalledOnce();
	});
});

describe("fetchJson", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it("dispatches success with parsed JSON of an ok response", async () => {
		stubFetchResponse(200, '{"a":1}');
		const {dispatch, getState, actionsOfType} = createThunkHarness();

		fetchJson("data", "/data.json")(dispatch, getState, undefined);
		await flushPromises();

		expect(actionsOfType(FETCH_JSON_SUCCESS)).toEqual([
			expect.objectContaining({key: "data", data: {a: 1}}),
		]);
	});

	it("dispatches failure instead of parsing an HTTP error body", async () => {
		stubFetchResponse(502, '{"error":"bad gateway"}');
		const {dispatch, getState, actionsOfType} = createThunkHarness();

		fetchJson("data", "/data.json")(dispatch, getState, undefined);
		await flushPromises();

		expect(actionsOfType(FETCH_JSON_SUCCESS)).toEqual([]);
		const failures = actionsOfType(FETCH_JSON_FAILURE);
		expect(failures).toHaveLength(1);
		expect(failures[0]?.error).toEqual(new Error("HTTP 502"));
	});

	it("dispatches failure once with the network error", async () => {
		const networkError = new TypeError("Failed to fetch");
		vi.stubGlobal(
			"fetch",
			vi.fn(() => Promise.reject(networkError)),
		);
		const {dispatch, getState, actionsOfType} = createThunkHarness();

		fetchJson("data", "/data.json")(dispatch, getState, undefined);
		await flushPromises();

		const failures = actionsOfType(FETCH_JSON_FAILURE);
		expect(failures).toHaveLength(1);
		expect(failures[0]?.error).toBe(networkError);
	});

	it("dispatches failure once for invalid JSON", async () => {
		stubFetchResponse(200, "not json");
		const {dispatch, getState, actionsOfType} = createThunkHarness();

		fetchJson("data", "/data.json")(dispatch, getState, undefined);
		await flushPromises();

		const failures = actionsOfType(FETCH_JSON_FAILURE);
		expect(failures).toHaveLength(1);
		expect(failures[0]?.error).toBeInstanceOf(SyntaxError);
	});

	it("does not dispatch failure when the success dispatch throws", async () => {
		const consoleError = vi
			.spyOn(console, "error")
			.mockImplementation(() => undefined);
		stubFetchResponse(200, '{"a":1}');
		const {dispatch, getState, actionsOfType} = createThunkHarness();
		const renderError = new Error("render failed");
		const baseDispatch = dispatch.getMockImplementation()!;
		dispatch.mockImplementation((action) => {
			if (action.type === FETCH_JSON_SUCCESS) {
				throw renderError;
			}
			return baseDispatch(action);
		});

		fetchJson("data", "/data.json")(dispatch, getState, undefined);
		await flushPromises();

		expect(actionsOfType(FETCH_JSON_FAILURE)).toEqual([]);
		expect(consoleError).toHaveBeenCalledWith(renderError);
	});
});
