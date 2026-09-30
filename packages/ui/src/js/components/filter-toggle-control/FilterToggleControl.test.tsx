import {cleanup, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, describe, expect, it} from "vitest";

import FilterToggleControl from "./FilterToggleControl";

afterEach(cleanup);

describe("FilterToggleControl", () => {
	it("names the trigger after its purpose and reports expansion", () => {
		render(
			<FilterToggleControl
				buttonClassName="closed"
				buttonActiveClassName="open"
				title="Filter by tags …"
			>
				<button type="button">panel content</button>
			</FilterToggleControl>,
		);

		const trigger = screen.getByRole("button", {name: "Filter by tags …"});
		expect(trigger.getAttribute("aria-expanded")).toBe("false");

		fireEvent.click(trigger);

		expect(
			screen
				.getByRole("button", {name: "Filter by tags …"})
				.getAttribute("aria-expanded"),
		).toBe("true");
		expect(
			screen.getByRole("button", {name: "panel content"}),
		).toBeTruthy();
	});
});
