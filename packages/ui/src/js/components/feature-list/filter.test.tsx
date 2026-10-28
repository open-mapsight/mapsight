import {type ReactNode} from "react";
import {Provider, useSelector} from "react-redux";

import {configureStore} from "@reduxjs/toolkit";
import {act, cleanup, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";

import {announceStatus} from "../../helpers/announce-status";
import {FILTER_LIST_QUERY, filterListQuery} from "../../store/actions";
import type {MapsightUiFeature} from "../../types";
import {
	FeatureListContextProvider,
	type FeatureListContextValue,
} from "./context";
import FeatureFilter from "./filter";
import {filterFeatures} from "./hooks/usePaginatedFilteredFeatures";

vi.mock("../../helpers/announce-status", () => ({announceStatus: vi.fn()}));

const features = [
	{id: "a", properties: {name: "Cafe"}},
	{id: "b", properties: {name: "Castle"}},
	{id: "c", properties: {name: "Museum"}},
] as MapsightUiFeature[];

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
	function Context({children}: {children: ReactNode}) {
		const query = useSelector((state: TestState) => state.app.listQuery);
		const value = {
			state: {
				features,
				featureCount: filterFeatures(query, features).length,
			},
		} as FeatureListContextValue;
		return (
			<FeatureListContextProvider value={value}>
				{children}
			</FeatureListContextProvider>
		);
	}
	const wrapper = ({children}: {children: ReactNode}) => (
		<Provider store={store}>
			<Context>{children}</Context>
		</Provider>
	);
	return render(<FeatureFilter />, {wrapper});
}

describe("FeatureFilter", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.mocked(announceStatus).mockClear();
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

	it("announces the settled query's result count or empty text", () => {
		renderFilter(makeStore());
		act(() => {
			vi.advanceTimersByTime(1000);
		});
		expect(announceStatus).not.toHaveBeenCalled();
		const input = screen.getByRole("searchbox");
		fireEvent.change(input, {target: {value: "ca"}});
		act(() => {
			vi.advanceTimersByTime(200);
		});
		act(() => {
			vi.advanceTimersByTime(200);
		});
		fireEvent.change(input, {target: {value: "castle"}});
		act(() => {
			vi.advanceTimersByTime(200);
		});
		expect(announceStatus).not.toHaveBeenCalled();
		act(() => {
			vi.advanceTimersByTime(300);
		});
		expect(announceStatus).toHaveBeenCalledExactlyOnceWith(
			"1 von 3 Einträgen",
		);
		fireEvent.change(input, {target: {value: "missing"}});
		act(() => {
			vi.advanceTimersByTime(200);
		});
		act(() => {
			vi.advanceTimersByTime(300);
		});
		expect(announceStatus).toHaveBeenLastCalledWith("Keine Einträge");
	});

	it("announces external query changes, including queries with the same result count", () => {
		const store = makeStore();
		renderFilter(store);
		act(() => {
			store.dispatch(filterListQuery("castle") as never);
		});
		act(() => {
			vi.advanceTimersByTime(300);
		});
		act(() => {
			store.dispatch(filterListQuery("museum") as never);
		});
		act(() => {
			vi.advanceTimersByTime(300);
		});
		expect(announceStatus).toHaveBeenCalledTimes(2);
	});
});
