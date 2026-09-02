import {cleanup, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, describe, expect, it} from "vitest";

import {FutureFlagsContext} from "../future/context";
import HintTooltip from "./hint-tooltip";

afterEach(cleanup);

describe("HintTooltip", () => {
	it("keeps hint.css classes when the future flag is off", () => {
		render(
			<HintTooltip text="Center map on a region" placement="right">
				<ul
					aria-label="Center map on a region"
					className="ms3-region-selector"
				/>
			</HintTooltip>,
		);

		const list = screen.getByRole("list", {
			name: "Center map on a region",
		});
		expect(list.className).toContain("ms3-hint--right");
		expect(list.className).toContain("ms3-hint--rounded");
		expect(screen.queryByRole("tooltip")).toBeNull();
	});

	it("uses the ARIA tooltip when v8_ariaControlTooltip is on", async () => {
		render(
			<FutureFlagsContext.Provider value={{v8_ariaControlTooltip: true}}>
				<HintTooltip text="Center map on a region" placement="right">
					<ul
						aria-label="Center map on a region"
						className="ms3-region-selector"
					/>
				</HintTooltip>
			</FutureFlagsContext.Provider>,
		);

		const list = screen.getByRole("list", {
			name: "Center map on a region",
		});
		expect(list.className).not.toContain("ms3-hint--");

		fireEvent.pointerMove(document.body, {pointerType: "mouse"});
		fireEvent.pointerEnter(list, {pointerType: "mouse"});

		expect(
			await screen.findByRole("tooltip", {
				name: "Center map on a region",
			}),
		).toBeTruthy();
	});
});
