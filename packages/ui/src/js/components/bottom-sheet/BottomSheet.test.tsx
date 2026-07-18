import {cleanup, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";

import BottomSheet from "./BottomSheet";

vi.mock("../close-overlay-button", () => ({
	default: function MockClose({onClose}: {onClose?: () => void}) {
		return (
			<button type="button" onClick={onClose}>
				close
			</button>
		);
	},
}));

describe("BottomSheet", () => {
	afterEach(() => {
		cleanup();
	});

	it("renders a labelled region with a focusable separator", () => {
		render(
			<BottomSheet
				open
				label="Details"
				resizeLabel="Resize details"
				snaps={[100, 200, 400, 600]}
				defaultSnapIndex={1}
				title="Place"
			>
				<div>body</div>
			</BottomSheet>,
		);

		expect(screen.getByRole("region", {name: "Details"})).toBeTruthy();
		expect(
			screen.getByRole("separator", {name: "Resize details"}),
		).toBeTruthy();
		expect(screen.getByText("body")).toBeTruthy();
	});

	it("moves one snap on ArrowUp", () => {
		const onSnapChange = vi.fn();
		render(
			<BottomSheet
				open
				label="Details"
				snaps={[100, 200, 400, 600]}
				defaultSnapIndex={1}
				onSnapChange={onSnapChange}
			>
				body
			</BottomSheet>,
		);

		fireEvent.keyDown(screen.getByRole("separator"), {key: "ArrowUp"});
		expect(onSnapChange).toHaveBeenCalledWith(2, 400);
	});

	it("calls onDismiss on Escape", () => {
		const onDismiss = vi.fn();
		render(
			<BottomSheet
				open
				label="Details"
				snaps={[100, 200, 400]}
				onDismiss={onDismiss}
			>
				body
			</BottomSheet>,
		);

		fireEvent.keyDown(document, {key: "Escape"});
		expect(onDismiss).toHaveBeenCalledTimes(1);
	});
});
