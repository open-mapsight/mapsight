import {useState} from "react";

import {cleanup, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, expect, it} from "vitest";

import SwitcherEntry from "./SwitcherEntry";
import SwitcherRadioGroup from "./SwitcherRadioGroup";

afterEach(cleanup);

function BaseMaps() {
	const [selected, select] = useState("Street");
	return (
		<SwitcherRadioGroup aria-label="Base map">
			{["Street", "Aerial", "Terrain"].map((title) => (
				<SwitcherEntry
					key={title}
					title={title}
					active={title === selected}
					exclusive
					toggleActive={() => select(title)}
				/>
			))}
		</SwitcherRadioGroup>
	);
}

it("has one Tab stop and wraps selection with unmodified arrow keys", () => {
	render(<BaseMaps />);
	const [street, aerial, terrain] =
		screen.getAllByRole<HTMLButtonElement>("radio");
	expect(screen.getByRole("radiogroup", {name: "Base map"})).toBeTruthy();
	expect([street!.tabIndex, aerial!.tabIndex, terrain!.tabIndex]).toEqual([
		0, -1, -1,
	]);
	street!.focus();
	for (const [key, next] of [
		["ArrowDown", aerial],
		["ArrowRight", terrain],
		["ArrowDown", street],
		["ArrowUp", terrain],
		["ArrowLeft", aerial],
	] as const) {
		fireEvent.keyDown(document.activeElement!, {key});
		expect(document.activeElement).toBe(next);
		expect(next!.getAttribute("aria-checked")).toBe("true");
		expect(
			screen
				.getAllByRole("radio")
				.filter((radio) => radio.tabIndex === 0),
		).toEqual([next]);
	}
	fireEvent.keyDown(aerial!, {key: "ArrowDown", ctrlKey: true});
	expect(document.activeElement).toBe(aerial);
});
