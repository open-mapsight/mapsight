import {useRef} from "react";

import {cleanup, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, expect, it, vi} from "vitest";

import useOverlayDismiss from "./useOverlayDismiss";

function Panel({onDismiss}: {onDismiss: () => void}) {
	const ref = useRef<HTMLDivElement>(null);
	useOverlayDismiss({isActive: true, onDismiss, excludeRefs: [ref]});
	return (
		<>
			<button type="button">outside</button>
			<div ref={ref}>
				<button type="button">inside</button>
				<input
					aria-label="handled"
					onKeyDown={(event) => event.preventDefault()}
				/>
				<dialog open>
					<input aria-label="nested" />
				</dialog>
			</div>
		</>
	);
}

afterEach(cleanup);

it("scopes Escape and respects handled and nested events while retaining outside-pointer dismissal", () => {
	const dismiss = vi.fn();
	render(<Panel onDismiss={dismiss} />);
	for (const target of [
		screen.getByRole("button", {name: "outside"}),
		...screen.getAllByRole("textbox"),
	]) {
		fireEvent.keyDown(target, {key: "Escape"});
	}
	expect(dismiss).not.toHaveBeenCalled();
	fireEvent.keyDown(screen.getByRole("button", {name: "inside"}), {
		key: "Escape",
	});
	expect(dismiss).toHaveBeenCalledOnce();
	fireEvent.pointerDown(screen.getByRole("button", {name: "inside"}));
	expect(dismiss).toHaveBeenCalledOnce();
	fireEvent.pointerDown(screen.getByRole("button", {name: "outside"}));
	expect(dismiss).toHaveBeenCalledTimes(2);
});
