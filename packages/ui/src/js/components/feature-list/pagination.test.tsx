import {Provider, useSelector} from "react-redux";

import {configureStore} from "@reduxjs/toolkit";
import {act, cleanup, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";

import {announceStatus} from "../../helpers/announce-status";
import {LIST_PAGE_SET} from "../../store/actions";
import Pagination from "./pagination";

vi.mock("../../helpers/announce-status", () => ({announceStatus: vi.fn()}));

beforeEach(() => {
	vi.useFakeTimers();
	vi.mocked(announceStatus).mockClear();
});
afterEach(() => {
	cleanup();
	vi.useRealTimers();
});

function renderPagination(count = 3, page = 0) {
	const store = configureStore({
		reducer: (state = {page}, action: {type: string; page?: number}) =>
			action.type === LIST_PAGE_SET ? {page: action.page!} : state,
	});
	function ConnectedPagination({count}: {count: number}) {
		const page = useSelector((state: {page: number}) => state.page);
		return <Pagination page={page} count={count} />;
	}
	const view = (count: number) => (
		<Provider store={store}>
			<ConnectedPagination count={count} />
		</Provider>
	);
	const {rerender} = render(view(count));
	return {store, setCount: (next: number) => rerender(view(next))};
}

describe("Pagination", () => {
	it("renders a named page list and marks the current page", () => {
		const {store} = renderPagination();
		const nav = screen.getByRole("navigation", {name: "Seitennavigation"});
		expect(nav.contains(screen.getByRole("list"))).toBe(true);
		expect(
			screen
				.getByRole("button", {name: "Sie sind aktuell auf Seite 1"})
				.getAttribute("aria-current"),
		).toBe("page");
		fireEvent.click(
			screen.getByRole("button", {name: "Zur Seite 2 blättern"}),
		);
		expect(store.getState().page).toBe(1);
	});

	it("jumps three pages with the named break controls", () => {
		const {store} = renderPagination(20, 9);
		fireEvent.click(
			screen.getByRole("button", {
				name: "Mehrere Seiten vorwärts blättern",
			}),
		);
		expect(store.getState().page).toBe(12);
		fireEvent.click(
			screen.getByRole("button", {
				name: "Mehrere Seiten zurück blättern",
			}),
		);
		expect(store.getState().page).toBe(9);
	});

	it("keeps focus on next when it becomes unavailable at the last page", () => {
		const {store} = renderPagination(3, 1);
		const next = screen.getByRole("button", {
			name: "Zur nächsten Seite blättern",
		});
		next.focus();
		fireEvent.click(next);
		expect(document.activeElement).toBe(next);
		expect(next.getAttribute("aria-disabled")).toBe("true");
		expect(next.tabIndex).toBe(-1);
		fireEvent.click(next);
		expect(store.getState().page).toBe(2);
	});

	it("moves to a valid page when the list shrinks or empties", () => {
		const {store, setCount} = renderPagination(3, 2);
		setCount(1);
		expect(store.getState().page).toBe(0);
		setCount(0);
		const buttons = screen.getAllByRole("button");
		expect(buttons).toHaveLength(2);
		for (const button of buttons) {
			expect(button.getAttribute("aria-disabled")).toBe("true");
		}
	});

	it("debounces page announcements and stays silent on mount", () => {
		renderPagination();
		act(() => {
			vi.advanceTimersByTime(300);
		});
		expect(announceStatus).not.toHaveBeenCalled();
		const next = screen.getByRole("button", {
			name: "Zur nächsten Seite blättern",
		});
		fireEvent.click(next);
		act(() => {
			vi.advanceTimersByTime(200);
		});
		fireEvent.click(next);
		act(() => {
			vi.advanceTimersByTime(300);
		});
		expect(announceStatus).toHaveBeenCalledExactlyOnceWith("Seite 3 von 3");
	});
});
