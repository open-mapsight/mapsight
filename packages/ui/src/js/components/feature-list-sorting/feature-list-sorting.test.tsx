import {cleanup, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";

import {setDocumentLanguage, translate} from "../../helpers/i18n";
import FeatureSorter from "./feature-list-sorting";

afterEach(() => {
	cleanup();
	setDocumentLanguage("de");
});

describe("FeatureSorter", () => {
	it.each(["de", "en"])(
		"names the select with its visible instruction in %s",
		(language) => {
			setDocumentLanguage(language);
			const onChange = vi.fn();
			render(
				<FeatureSorter
					places={{town: {title: "Town", x: 0, y: 0}}}
					sorting=""
					geolocationStatus=""
					onChange={onChange}
					requestGeolocation={vi.fn()}
				/>,
			);
			fireEvent.click(
				screen.getByRole("button", {
					name: translate("ui.feature-list.sorting.announcements"),
				}),
			);
			const select = screen.getByRole("combobox", {
				name: translate("ui.feature-list.sorting.byDistance"),
			});
			const label = document.getElementById(
				select.getAttribute("aria-labelledby")!,
			);
			expect(label?.textContent).toBe(
				translate("ui.feature-list.sorting.byDistance"),
			);
			fireEvent.change(select, {target: {value: "town"}});
			expect(onChange).toHaveBeenCalledWith("town");
		},
	);
});
