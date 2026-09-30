import {Provider} from "react-redux";

import {configureStore} from "@reduxjs/toolkit";
import {cleanup, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";

import {setDocumentLanguage} from "../../helpers/i18n";
import ZoomButtons from "./zoom-buttons";

function renderZoomButtons() {
	const store = configureStore({
		reducer: {
			map: (state = {view: {zoom: 10}}) => state,
		},
	});
	const dispatch = vi.spyOn(store, "dispatch");
	render(
		<Provider store={store}>
			<ZoomButtons />
		</Provider>,
	);
	return dispatch;
}

function dispatchedZoom(dispatch: ReturnType<typeof renderZoomButtons>) {
	const action = dispatch.mock.lastCall?.[0] as unknown as {
		options?: {zoom?: number};
	};
	return action.options?.zoom;
}

describe("ZoomButtons", () => {
	afterEach(() => {
		cleanup();
		setDocumentLanguage("de");
	});

	it("names the zoom-in button after what it does", () => {
		setDocumentLanguage("en");
		const dispatch = renderZoomButtons();

		fireEvent.click(screen.getByRole("button", {name: "zoom in"}));
		expect(dispatchedZoom(dispatch)).toBe(11);

		fireEvent.click(screen.getByRole("button", {name: "zoom out"}));
		expect(dispatchedZoom(dispatch)).toBe(9);
	});

	it("uses matching German labels", () => {
		setDocumentLanguage("de");
		const dispatch = renderZoomButtons();

		fireEvent.click(screen.getByRole("button", {name: "Karte vergrößern"}));
		expect(dispatchedZoom(dispatch)).toBe(11);
	});
});
