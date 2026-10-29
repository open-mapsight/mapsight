import {Provider} from "react-redux";

import {configureStore} from "@reduxjs/toolkit";
import {cleanup, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, expect, it} from "vitest";

import {translate} from "../../helpers/i18n";
import RegionSelector from "./region-selector";

afterEach(cleanup);

it("uses an ARIA tooltip and keeps the region selector named without future flags", async () => {
	const store = configureStore({
		reducer: () => ({
			app: {
				regions: {city: {label: "City"}},
				selectedRegion: "city",
			},
		}),
	});
	render(
		<Provider store={store}>
			<RegionSelector />
		</Provider>,
	);
	const label = translate("ui.region-selector.label");
	const list = screen.getByRole("list", {name: label});
	expect(list.className).not.toContain("ms3-hint--");
	expect(
		screen.getByRole("button", {name: "City"}).getAttribute("aria-pressed"),
	).toBe("true");
	fireEvent.pointerMove(document.body, {pointerType: "mouse"});
	fireEvent.pointerEnter(list, {pointerType: "mouse"});
	expect(await screen.findByRole("tooltip", {name: label})).toBeTruthy();
});
