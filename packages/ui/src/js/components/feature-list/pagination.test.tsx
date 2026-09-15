import {Provider} from "react-redux";

import {configureStore} from "@reduxjs/toolkit";
import {cleanup, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, describe, expect, it} from "vitest";

import {LIST_PAGE_SET} from "../../store/actions";
import Pagination from "./pagination";

afterEach(cleanup);

function makeStore() {
	return configureStore({
		reducer: {
			app: (
				state = {listPage: 0},
				action: {type: string; page?: number},
			) => {
				if (action.type === LIST_PAGE_SET) {
					return {...state, listPage: action.page};
				}
				return state;
			},
		},
	});
}

describe("Pagination", () => {
	it("renders page controls and changes page on click", () => {
		const store = makeStore();
		render(
			<Provider store={store}>
				<Pagination page={0} count={3} />
			</Provider>,
		);

		const list = document.querySelector(".ms3-list-pagination");
		expect(list).not.toBeNull();
		expect(
			screen.getByRole("button", {name: "Zur Seite 2 blättern"}),
		).not.toBeNull();

		fireEvent.click(
			screen.getByRole("button", {name: "Zur Seite 2 blättern"}),
		);
		expect(store.getState().app.listPage).toBe(1);
	});
});
