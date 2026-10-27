import {FocusScope} from "react-aria";

import {cleanup, render, screen, waitFor} from "@testing-library/react";
import {afterEach, expect, it} from "vitest";

import Wrapper from "./wrapper";

afterEach(cleanup);

it("deactivates an opted-in focus trap when the current keyboard prop becomes false", async () => {
	const content = (enabled: boolean) => (
		<>
			<FocusScope contain={enabled}>
				<Wrapper enableKeyboardControl={enabled}>
					<button type="button">inside</button>
				</Wrapper>
			</FocusScope>
			<button type="button">outside</button>
		</>
	);
	const {rerender} = render(content(true));
	const outside = screen.getByRole("button", {name: "outside"});
	outside.focus();
	await waitFor(() => expect(document.activeElement).not.toBe(outside));
	rerender(content(false));
	outside.focus();
	expect(document.activeElement).toBe(outside);
});
