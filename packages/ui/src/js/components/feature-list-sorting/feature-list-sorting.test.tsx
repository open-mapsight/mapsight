import {cleanup, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";

import {translate} from "../../helpers/i18n";
import FeatureSorter from "./feature-list-sorting";

afterEach(cleanup);

describe("FeatureSorter", () => {
	it("names the select with its visible instruction", () => {
		render(
			<FeatureSorter
				places={{town: {title: "Town", x: 0, y: 0}}}
				sorting=""
				geolocationStatus=""
				onChange={vi.fn()}
				requestGeolocation={vi.fn()}
			/>,
		);
		fireEvent.click(
			screen.getByRole("button", {
				name: translate("ui.feature-list.sorting.announcements"),
			}),
		);
		expect(
			screen.getByRole("combobox", {
				name: translate("ui.feature-list.sorting.byDistance"),
			}),
		).toBeTruthy();
	});
});
