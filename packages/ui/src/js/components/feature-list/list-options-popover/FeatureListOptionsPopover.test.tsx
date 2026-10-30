import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";

import {translate} from "../../../helpers/i18n";
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

afterEach(cleanup);

describe("FeatureListOptionsPopover", () => {
	it("names the dialog with its heading on every opening", async () => {
		render(<FeatureListOptionsPopover />);
		const title = translate("ui.feature-list.options.title");
		const trigger = screen.getByRole("button", {
			name: translate("ui.feature-list.options.trigger"),
		});
		for (let i = 0; i < 2; i++) {
			fireEvent.click(trigger);
			const dialog = await screen.findByRole("dialog", {name: title});
			expect(dialog.getAttribute("aria-labelledby")).toBe(
				screen.getByRole("heading", {name: title}).id,
			);
			fireEvent.click(
				screen.getByRole("button", {
					name: translate("ui.feature-list.options.close"),
				}),
			);
			await waitFor(() =>
				expect(screen.queryByRole("dialog")).toBeNull(),
			);
		}
	});
});
