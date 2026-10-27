import {cleanup, render, screen} from "@testing-library/react";
import {afterEach, expect, it} from "vitest";

import Wrapper from "./wrapper";

const feature = {
	id: "place",
	type: "Feature" as const,
	geometry: null,
	properties: {name: "Place"},
};

afterEach(cleanup);

it("deactivates an opted-in focus trap when the current keyboard prop becomes false", () => {
	const content = (enabled: boolean) => (
		<>
			<Wrapper
				feature={feature}
				enableKeyboardControl={enabled}
				trapFocus
			>
				<button type="button">inside</button>
			</Wrapper>
			<button type="button">outside</button>
		</>
	);
	const {rerender} = render(content(true));
	const outside = screen.getByRole("button", {name: "outside"});
	outside.focus();
	expect(document.activeElement).not.toBe(outside);
	rerender(content(false));
	outside.focus();
	expect(document.activeElement).toBe(outside);
});
