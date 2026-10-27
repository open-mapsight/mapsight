import {Provider, useSelector} from "react-redux";

import {configureStore} from "@reduxjs/toolkit";
import {act, cleanup, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";

import {announceStatus} from "../../helpers/announce-status";
import {setDocumentLanguage, translate} from "../../helpers/i18n";
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
	setDocumentLanguage("de");
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
	const result = render(view(count));
	return {
		...result,
		store,
		setCount: (next: number) => result.rerender(view(next)),
	};
}

describe("Pagination", () => {
	it.each(["de", "en"])(
		"uses a translated nav, a plain list and current-page name in %s",
		(language) => {
			setDocumentLanguage(language);
			const {store} = renderPagination();
			const nav = screen.getByRole("navigation", {
				name: translate("ui.pagination.label"),
			});
			const list = screen.getByRole("list");
			expect(nav.contains(list)).toBe(true);
			expect(list.tagName).toBe("UL");
			expect(list.hasAttribute("role")).toBe(false);
			expect(
				screen
					.getAllByRole("listitem")
					.every((item) => item.parentElement === list),
			).toBe(true);
			const current = screen.getByRole("button", {
				name: translate("ui.pagination.goToSelectedPageLabel").replace(
					"{page}",
					"1",
				),
			});
			expect(current.getAttribute("aria-current")).toBe("page");
			const next = screen.getByRole("button", {
				name: translate("ui.pagination.goToPageLabel").replace(
					"{page}",
					"2",
				),
			});
			expect(next.tagName).toBe("BUTTON");
			fireEvent.click(next);
			expect(store.getState().page).toBe(1);
		},
	);

	it.each(["de", "en"])(
		"translates both jump controls and jumps three pages in %s",
		(language) => {
			setDocumentLanguage(language);
			const {store} = renderPagination(20, 9);
			fireEvent.click(
				screen.getByRole("button", {
					name: translate("ui.pagination.jumpForward"),
				}),
			);
			expect(store.getState().page).toBe(12);
			fireEvent.click(
				screen.getByRole("button", {
					name: translate("ui.pagination.jumpBackward"),
				}),
			);
			expect(store.getState().page).toBe(9);
		},
	);

	it("disables previous/next at the bounds and handles empty or shrinking lists", () => {
		const {store, setCount} = renderPagination(3);
		const previous = screen.getByRole("button", {
			name: translate("ui.pagination.prevPageLabel"),
		});
		expect(previous.getAttribute("aria-disabled")).toBe("true");
		expect(previous.tabIndex).toBe(-1);
		fireEvent.click(previous);
		expect(store.getState().page).toBe(0);
		fireEvent.click(
			screen.getByRole("button", {name: "Zur Seite 3 blättern"}),
		);
		const next = screen.getByRole("button", {
			name: translate("ui.pagination.nextPageLabel"),
		});
		expect(next.getAttribute("aria-disabled")).toBe("true");
		expect(next.tabIndex).toBe(-1);
		fireEvent.click(next);
		expect(store.getState().page).toBe(2);
		setCount(1);
		expect(store.getState().page).toBe(0);
		expect(
			screen
				.getByRole("button", {name: "Sie sind aktuell auf Seite 1"})
				.getAttribute("aria-current"),
		).toBe("page");
		setCount(0);
		expect(screen.getAllByRole("button")).toHaveLength(2);
		expect(
			screen
				.getAllByRole("button")
				.every(
					(button) => button.getAttribute("aria-disabled") === "true",
				),
		).toBe(true);
	});

	it("keeps focus on next when it becomes unavailable at the last page", () => {
		renderPagination(3, 1);
		const next = screen.getByRole("button", {
			name: translate("ui.pagination.nextPageLabel"),
		});
		next.focus();
		fireEvent.click(next);
		expect(document.activeElement).toBe(next);
		expect(next.getAttribute("aria-disabled")).toBe("true");
		expect(next.tabIndex).toBe(-1);
	});

	it.each(["de", "en"])(
		"debounces page announcements and stays silent on mount in %s",
		(language) => {
			setDocumentLanguage(language);
			renderPagination();
			act(() => {
				vi.advanceTimersByTime(300);
			});
			expect(announceStatus).not.toHaveBeenCalled();
			fireEvent.click(
				screen.getByRole("button", {
					name: translate("ui.pagination.nextPageLabel"),
				}),
			);
			act(() => {
				vi.advanceTimersByTime(200);
			});
			fireEvent.click(
				screen.getByRole("button", {
					name: translate("ui.pagination.nextPageLabel"),
				}),
			);
			act(() => {
				vi.advanceTimersByTime(299);
			});
			expect(announceStatus).not.toHaveBeenCalled();
			act(() => {
				vi.advanceTimersByTime(1);
			});
			expect(announceStatus).toHaveBeenCalledExactlyOnceWith(
				translate("ui.pagination.status")
					.replace("{n}", "3")
					.replace("{total}", "3"),
			);
		},
	);

	it("cancels a pending announcement when unmounted", () => {
		const {unmount} = renderPagination();
		fireEvent.click(
			screen.getByRole("button", {
				name: translate("ui.pagination.nextPageLabel"),
			}),
		);
		unmount();
		act(() => {
			vi.advanceTimersByTime(300);
		});
		expect(announceStatus).not.toHaveBeenCalled();
	});
});
