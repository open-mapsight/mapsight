import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";

import {setDocumentLanguage, translate} from "../../../helpers/i18n";
import FeatureListOptionsPopover from "./FeatureListOptionsPopover";

vi.mock("./useListOptionsController", () => ({
	default: () => ({
		featureCount: 2,
		totalFeatureCount: 2,
		sorting: "",
		places: {},
		geolocationStatus: "",
		activeFilterCount: 0,
		canResetOptions: false,
		hasCustomSorting: false,
		setSorting: vi.fn(),
		reset: vi.fn(),
	}),
}));

afterEach(() => {
	cleanup();
	setDocumentLanguage("de");
});

describe("FeatureListOptionsPopover", () => {
	it.each(["de", "en"])(
		"names each opened dialog with its rendered heading in %s",
		async (language) => {
			setDocumentLanguage(language);
			render(<FeatureListOptionsPopover />);
			const trigger = screen.getByRole("button", {
				name: translate("ui.feature-list.options.trigger"),
			});
			expect(trigger.hasAttribute("aria-controls")).toBe(false);
			expect(trigger.getAttribute("aria-expanded")).toBe("false");
			for (let i = 0; i < 2; i++) {
				fireEvent.click(trigger);
				const dialog = await screen.findByRole("dialog", {
					name: translate("ui.feature-list.options.title"),
				});
				const heading = screen.getByRole("heading", {
					name: translate("ui.feature-list.options.title"),
				});
				expect(dialog.getAttribute("aria-labelledby")).toBe(heading.id);
				expect(dialog.contains(heading)).toBe(true);
				expect(trigger.getAttribute("aria-controls")).toBe(dialog.id);
				fireEvent.click(
					screen.getByRole("button", {
						name: translate("ui.feature-list.options.close"),
					}),
				);
				await waitFor(() =>
					expect(screen.queryByRole("dialog")).toBeNull(),
				);
				expect(trigger.hasAttribute("aria-controls")).toBe(false);
			}
		},
	);
});
