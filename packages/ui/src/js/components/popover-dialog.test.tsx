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
		useDialog: (props: Record<string, unknown> = {}) => ({
			dialogProps: {
				role: "dialog",
				...(props["aria-label"] != null
					? {"aria-label": props["aria-label"]}
					: {}),
				...(props["aria-labelledby"] != null
					? {"aria-labelledby": props["aria-labelledby"]}
					: {}),
			},
			titleProps: {id: "title"},
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

	it("names the dialog with aria-label when title is omitted", () => {
		const triggerRef = createRef<HTMLButtonElement>();
		render(
			<PopoverDialog
				isOpen
				onClose={vi.fn()}
				triggerRef={triggerRef}
				aria-label="Filters"
				hideCloseButton
				portal={false}
			>
				<div>body-content</div>
			</PopoverDialog>,
		);

		expect(screen.getByRole("dialog", {name: "Filters"})).toBeTruthy();
		expect(screen.queryByRole("heading")).toBeNull();
	});

	it("uses labelledBy as the heading id when both are provided", () => {
		const triggerRef = createRef<HTMLButtonElement>();
		render(
			<PopoverDialog
				isOpen
				onClose={vi.fn()}
				triggerRef={triggerRef}
				title="Options"
				labelledBy="opts-title"
				portal={false}
			>
				<div>body-content</div>
			</PopoverDialog>,
		);

		expect(screen.getByRole("heading", {name: "Options"}).id).toBe(
			"opts-title",
		);
		expect(screen.getByRole("dialog").getAttribute("aria-labelledby")).toBe(
			"opts-title",
		);
	});
});
