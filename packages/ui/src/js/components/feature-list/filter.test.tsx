import {type ReactNode} from "react";
import {Provider} from "react-redux";

import {configureStore} from "@reduxjs/toolkit";
import {act, cleanup, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";

import {FILTER_LIST_QUERY, filterListQuery} from "../../store/actions";
import FeatureFilter from "./filter";

type TestState = {
	app: {listQuery: string; listQueryEpoch?: number};
};

function makeStore(listQuery = "") {
	return configureStore({
		reducer: {
			app: (
				current = {listQuery, listQueryEpoch: 0},
				action: {type: string; query?: string},
			) =>
				action.type === FILTER_LIST_QUERY
					? {
							...current,
							listQuery: action.query ?? "",
							listQueryEpoch: (current.listQueryEpoch ?? 0) + 1,
						}
					: current,
		},
		preloadedState: {
			app: {listQuery, listQueryEpoch: 0},
		} satisfies TestState,
	});
}

function renderFilter(store: ReturnType<typeof makeStore>) {
	const wrapper = ({children}: {children: ReactNode}) => (
		<Provider store={store}>{children}</Provider>
	);
	return render(<FeatureFilter />, {wrapper});
}

describe("FeatureFilter", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		cleanup();
		vi.useRealTimers();
	});

	it("does not revert keystrokes when an earlier debounce commits to the store", () => {
		const store = makeStore();
		renderFilter(store);

		const input = screen.getByRole("searchbox");
		fireEvent.change(input, {target: {value: "a"}});
		act(() => {
			vi.advanceTimersByTime(200);
		});
		expect(store.getState().app.listQuery).toBe("a");

		fireEvent.change(input, {target: {value: "ab"}});
		expect(input).toHaveProperty("value", "ab");
		expect(store.getState().app.listQuery).toBe("a");
	});

	it("discards pending keystrokes when an external reset writes the same empty query", () => {
		const store = makeStore();
		renderFilter(store);

		const input = screen.getByRole("searchbox");
		fireEvent.change(input, {target: {value: "cafe"}});
		expect(input).toHaveProperty("value", "cafe");

		act(() => {
			store.dispatch(filterListQuery("") as never);
		});

		expect(input).toHaveProperty("value", "");
		act(() => {
			vi.advanceTimersByTime(200);
		});
		expect(store.getState().app.listQuery).toBe("");
	});

	it("applies an external store query that this field did not dispatch", () => {
		const store = makeStore("cafe");
		renderFilter(store);

		expect(screen.getByRole("searchbox")).toHaveProperty("value", "cafe");

		act(() => {
			store.dispatch(filterListQuery("") as never);
		});

		expect(screen.getByRole("searchbox")).toHaveProperty("value", "");
	});
});
