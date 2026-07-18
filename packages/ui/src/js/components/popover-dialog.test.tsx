import {type ReactNode, createRef} from "react";

import {cleanup, render, screen} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";

import PopoverDialog from "./popover-dialog";

vi.mock("./close-overlay-button", () => ({
	default: function MockClose({onClose}: {onClose?: () => void}) {
		return (
			<button type="button" onClick={onClose}>
				close
			</button>
		);
	},
}));

vi.mock("react-aria", async (importOriginal) => {
	const actual = await importOriginal<Record<string, unknown>>();
	return {
		...actual,
		useOverlay: () => ({overlayProps: {}}),
		useDialog: () => ({
			dialogProps: {role: "dialog"},
			titleProps: {},
		}),
		useOverlayPosition: () => ({
			overlayProps: {style: {position: "absolute" as const}},
			placement: "bottom",
			arrowProps: {},
			updatePosition: vi.fn(),
		}),
		OverlayContainer: ({children}: {children: ReactNode}) => (
			<div data-testid="overlay-root">{children}</div>
		),
		FocusScope: ({children}: {children: ReactNode}) => <>{children}</>,
		DismissButton: ({onDismiss}: {onDismiss?: () => void}) => (
			<button type="button" onClick={onDismiss}>
				dismiss
			</button>
		),
		mergeProps: (...args: Array<Record<string, unknown>>) =>
			Object.assign({}, ...args) as Record<string, unknown>,
	};
});

describe("PopoverDialog", () => {
	afterEach(() => {
		cleanup();
	});

	it("renders nothing when closed", () => {
		const triggerRef = createRef<HTMLButtonElement>();
		const {container} = render(
			<PopoverDialog
				isOpen={false}
				onClose={vi.fn()}
				triggerRef={triggerRef}
				title="Options"
			>
				body
			</PopoverDialog>,
		);
		expect(container.textContent).toBe("");
	});

	it("renders a titled dialog panel when open", () => {
		const triggerRef = createRef<HTMLButtonElement>();
		render(
			<PopoverDialog
				isOpen
				onClose={vi.fn()}
				triggerRef={triggerRef}
				title="Options"
				portal={false}
			>
				<div>body-content</div>
			</PopoverDialog>,
		);

		expect(screen.getByRole("dialog")).toBeTruthy();
		expect(screen.getByRole("heading", {name: "Options"})).toBeTruthy();
		expect(screen.getByText("body-content")).toBeTruthy();
	});
});
