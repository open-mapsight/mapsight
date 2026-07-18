import {act, cleanup, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, beforeAll, describe, expect, it, vi} from "vitest";

import useNativeDialog from "./useNativeDialog";

/** jsdom does not implement `<dialog>` modal methods. */
function polyfillDialog(): void {
	const proto = HTMLDialogElement.prototype;
	if (typeof proto.showModal === "function") {
		return;
	}

	Object.defineProperty(proto, "open", {
		configurable: true,
		get(this: HTMLDialogElement) {
			return this.hasAttribute("open");
		},
		set(this: HTMLDialogElement, value: boolean) {
			if (value) {
				this.setAttribute("open", "");
			} else {
				this.removeAttribute("open");
			}
		},
	});

	proto.showModal = function showModal(this: HTMLDialogElement) {
		this.open = true;
	};
	proto.close = function close(this: HTMLDialogElement) {
		this.open = false;
		this.dispatchEvent(new Event("close"));
	};
}

function DialogHarness({
	isOpen,
	onClose,
	dismissOnBackdrop,
}: {
	isOpen: boolean;
	onClose: () => void;
	dismissOnBackdrop?: boolean;
}) {
	const {dialogRef, dialogProps} = useNativeDialog({
		isOpen,
		onClose,
		dismissOnBackdrop,
	});

	return (
		<dialog ref={dialogRef} {...dialogProps} data-testid="dlg">
			<button type="button">inside</button>
		</dialog>
	);
}

describe("useNativeDialog", () => {
	beforeAll(() => {
		polyfillDialog();
	});

	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	it("opens and closes the dialog when isOpen changes", () => {
		const onClose = vi.fn();
		const {rerender} = render(
			<DialogHarness isOpen={false} onClose={onClose} />,
		);

		expect(screen.getByTestId("dlg").hasAttribute("open")).toBe(false);

		rerender(<DialogHarness isOpen={true} onClose={onClose} />);
		expect(screen.getByTestId("dlg").hasAttribute("open")).toBe(true);

		rerender(<DialogHarness isOpen={false} onClose={onClose} />);
		expect(screen.getByTestId("dlg").hasAttribute("open")).toBe(false);
	});

	it("calls onClose on cancel and prevents the default close", () => {
		const onClose = vi.fn();
		render(<DialogHarness isOpen={true} onClose={onClose} />);

		const dialog = screen.getByTestId("dlg");
		const cancelEvent = new Event("cancel", {
			bubbles: true,
			cancelable: true,
		});

		act(() => {
			dialog.dispatchEvent(cancelEvent);
		});

		expect(cancelEvent.defaultPrevented).toBe(true);
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("calls onClose when the backdrop (dialog element) is clicked", () => {
		const onClose = vi.fn();
		render(<DialogHarness isOpen={true} onClose={onClose} />);

		fireEvent.click(screen.getByTestId("dlg"));
		expect(onClose).toHaveBeenCalledTimes(1);

		onClose.mockClear();
		fireEvent.click(screen.getByRole("button", {name: "inside"}));
		expect(onClose).not.toHaveBeenCalled();
	});

	it("does not dismiss on backdrop when dismissOnBackdrop is false", () => {
		const onClose = vi.fn();
		render(
			<DialogHarness
				isOpen={true}
				onClose={onClose}
				dismissOnBackdrop={false}
			/>,
		);

		fireEvent.click(screen.getByTestId("dlg"));
		expect(onClose).not.toHaveBeenCalled();
	});
});
