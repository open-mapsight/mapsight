import ReactModal from "react-modal";
import {Provider} from "react-redux";

import {configureStore} from "@reduxjs/toolkit";
import {act, cleanup, render, screen} from "@testing-library/react";
import {afterEach, describe, expect, it} from "vitest";

import {VIEW_DESKTOP, VIEW_MOBILE} from "../../config/constants/app";
import type {View} from "../../config/constants/app";
import {setDocumentLanguage} from "../../helpers/i18n";
import {SET_OVERLAY_MODAL_VISIBLE, SET_VIEW} from "../../store/actions";
import InfoOverlayModal from "./info-overlay-modal";

afterEach(cleanup);

type AppSlice = {
	view: View;
	isOverlayModalVisible: boolean;
};

function createStore(view: View) {
	return configureStore({
		reducer: {
			app: (
				state: AppSlice = {view, isOverlayModalVisible: true},
				action: {type: string; visible?: boolean; value?: View},
			) => {
				if (action.type === SET_OVERLAY_MODAL_VISIBLE) {
					return {...state, isOverlayModalVisible: !!action.visible};
				}
				if (action.type === SET_VIEW) {
					return {...state, view: action.value ?? state.view};
				}
				return state;
			},
		},
	});
}

describe("InfoOverlayModal", () => {
	it("keeps Citations open after leaving mobile view", () => {
		setDocumentLanguage("en");
		ReactModal.setAppElement(document.createElement("div"));
		const store = createStore(VIEW_MOBILE);

		render(
			<Provider store={store}>
				<InfoOverlayModal>
					<p>Citations body</p>
				</InfoOverlayModal>
			</Provider>,
		);

		expect(screen.getByText("Citations body")).toBeTruthy();

		act(() => {
			store.dispatch({type: SET_VIEW, value: VIEW_DESKTOP});
		});

		expect(screen.getByText("Citations body")).toBeTruthy();
		expect(store.getState().app.isOverlayModalVisible).toBe(true);
	});
});
