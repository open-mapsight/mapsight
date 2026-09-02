import {cleanup, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";

import {setDocumentLanguage} from "../../helpers/i18n";
import SwitcherEntry from "./SwitcherEntry";

afterEach(() => {
	cleanup();
	setDocumentLanguage("de");
});

describe("SwitcherEntry exclusive base-layer selection", () => {
	it("disables the active exclusive button with a cannot-deselect label", () => {
		setDocumentLanguage("en");
		const toggleActive = vi.fn();

		render(
			<SwitcherEntry
				title="Street map"
				active
				exclusive
				toggleActive={toggleActive}
			/>,
		);

		const button = screen.getByRole("radio", {
			name: /Street map, active\. A base map must remain selected\./i,
		});
		expect(button.hasAttribute("disabled")).toBe(true);
		expect(button.getAttribute("aria-checked")).toBe("true");
		expect(button.getAttribute("aria-disabled")).toBe("true");

		fireEvent.click(button);
		expect(toggleActive).not.toHaveBeenCalled();
	});

	it("keeps inactive exclusive buttons enabled so another base layer can be selected", () => {
		setDocumentLanguage("en");
		const toggleActive = vi.fn();

		render(
			<SwitcherEntry
				title="Aerial"
				active={false}
				exclusive
				toggleActive={toggleActive}
			/>,
		);

		const button = screen.getByRole("radio", {name: "Aerial, inactive"});
		expect(button.hasAttribute("disabled")).toBe(false);
		expect(button.getAttribute("aria-checked")).toBe("false");
		expect(button.getAttribute("aria-disabled")).toBeNull();

		fireEvent.click(button);
		expect(toggleActive).toHaveBeenCalledTimes(1);
	});

	it("renders optional end content after the title", () => {
		render(
			<SwitcherEntry
				title="Parking"
				active
				toggleActive={() => undefined}
				end={<span>LIVE</span>}
			/>,
		);

		expect(screen.getByText("LIVE")).toBeTruthy();
		expect(
			screen.getByRole("checkbox", {name: /Parking/}).textContent,
		).toContain("LIVE");
	});

	it("does not disable a regular active checkbox entry", () => {
		const toggleActive = vi.fn();

		render(
			<SwitcherEntry
				title="Parking"
				active
				toggleActive={toggleActive}
			/>,
		);

		const button = screen.getByRole("checkbox", {name: /Parking/});
		expect(button.hasAttribute("disabled")).toBe(false);
		expect(button.getAttribute("aria-checked")).toBe("true");

		fireEvent.click(button);
		expect(toggleActive).toHaveBeenCalledTimes(1);
	});
});
