import {StrictMode, createRef} from "react";
import {FocusScope} from "react-aria";

import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";

import {setDocumentLanguage} from "../../helpers/i18n";
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
		document.body.replaceChildren();
		setDocumentLanguage("de");
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

		expect(screen.getByRole("region", {name: "Place"})).toBeTruthy();
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

		fireEvent.keyDown(screen.getByRole("separator"), {key: "Escape"});
		expect(onDismiss).toHaveBeenCalledTimes(1);
	});
	it("keeps the named heading outside the presentational separator", () => {
		render(<BottomSheet label="Details" title="Place" />);
		const heading = screen.getByRole("heading", {name: "Place", level: 2});
		expect(screen.getByRole("separator").contains(heading)).toBe(false);
		expect(
			screen
				.getByRole("region", {name: "Place"})
				.getAttribute("aria-labelledby"),
		).toBe(heading.id);
	});

	it.each([
		["de", "Höhe ändern", "Position 2 von 3"],
		["en", "Resize", "Position 2 of 3"],
	])(
		"translates the resize name and default snap text in %s",
		(locale, name, value) => {
			setDocumentLanguage(locale);
			render(<BottomSheet label="Details" snaps={[100, 200, 300]} />);
			expect(
				screen
					.getByRole("separator", {name})
					.getAttribute("aria-valuetext"),
			).toBe(value);
		},
	);

	it("allows hosts to override the resize name and value text", () => {
		render(
			<BottomSheet
				label="Details"
				resizeLabel="Height"
				snapValueText={() => "Half open"}
			/>,
		);
		expect(
			screen
				.getByRole("separator", {name: "Height"})
				.getAttribute("aria-valuetext"),
		).toBe("Half open");
	});

	it("ignores Escape outside the sheet and in a nested search dialog", () => {
		const onDismiss = vi.fn();
		render(
			<>
				<button type="button">outside</button>
				<BottomSheet label="Details" onDismiss={onDismiss}>
					<dialog open>
						<input aria-label="Search" />
					</dialog>
				</BottomSheet>
			</>,
		);
		fireEvent.keyDown(screen.getByRole("button", {name: "outside"}), {
			key: "Escape",
		});
		fireEvent.keyDown(screen.getByRole("textbox", {name: "Search"}), {
			key: "Escape",
		});
		expect(onDismiss).not.toHaveBeenCalled();
	});

	it.each(["within", "document"] as const)(
		"respects child preventDefault in %s mode",
		(dismissOnEscape) => {
			const onDismiss = vi.fn();
			render(
				<BottomSheet
					label="Details"
					dismissOnEscape={dismissOnEscape}
					onDismiss={onDismiss}
				>
					<input
						aria-label="Search"
						onKeyDown={(event) => event.preventDefault()}
					/>
				</BottomSheet>,
			);
			fireEvent.keyDown(screen.getByRole("textbox"), {key: "Escape"});
			expect(onDismiss).not.toHaveBeenCalled();
		},
	);

	it("offers document-wide Escape as an explicit legacy option, excluding other dialogs", () => {
		const onDismiss = vi.fn();
		render(
			<>
				<button type="button">outside</button>
				<dialog open>
					<input aria-label="Search" />
				</dialog>
				<BottomSheet
					label="Details"
					dismissOnEscape="document"
					onDismiss={onDismiss}
				/>
			</>,
		);
		fireEvent.keyDown(screen.getByRole("textbox"), {key: "Escape"});
		expect(onDismiss).not.toHaveBeenCalled();
		fireEvent.keyDown(screen.getByRole("button", {name: "outside"}), {
			key: "Escape",
		});
		expect(onDismiss).toHaveBeenCalledOnce();
		fireEvent.keyDown(document, {key: "Escape"});
		expect(onDismiss).toHaveBeenCalledTimes(2);
	});

	it("can disable Escape without disabling the close button", () => {
		const onDismiss = vi.fn();
		render(
			<BottomSheet
				label="Details"
				dismissOnEscape={false}
				onDismiss={onDismiss}
			/>,
		);
		fireEvent.keyDown(screen.getByRole("separator"), {key: "Escape"});
		expect(onDismiss).not.toHaveBeenCalled();
		fireEvent.click(screen.getByRole("button", {name: "close"}));
		expect(onDismiss).toHaveBeenCalledOnce();
	});

	it("does not move focus by default", () => {
		const opener = document.createElement("button");
		document.body.append(opener);
		opener.focus();
		render(<BottomSheet label="Details" title="Place" />);
		expect(document.activeElement).toBe(opener);
	});

	it("focuses the heading on open and restores the opener on close", async () => {
		const opener = document.createElement("button");
		document.body.append(opener);
		opener.focus();
		const {rerender} = render(
			<BottomSheet
				open={false}
				label="Details"
				title="Place"
				initialFocus
				restoreFocus
			/>,
		);
		rerender(
			<BottomSheet
				open
				label="Details"
				title="Place"
				initialFocus
				restoreFocus
			/>,
		);
		expect(document.activeElement).toBe(screen.getByRole("heading"));
		rerender(
			<BottomSheet
				open={false}
				label="Details"
				title="Place"
				initialFocus
				restoreFocus
			/>,
		);
		await waitFor(() => expect(document.activeElement).toBe(opener));
	});

	it("focuses the region when initialFocus is true without a title", () => {
		render(<BottomSheet label="Details" initialFocus />);
		expect(document.activeElement).toBe(screen.getByRole("region"));
	});

	it("accepts custom initial and return focus refs and restores on unmount", async () => {
		const initial = createRef<HTMLButtonElement>();
		const restore = createRef<HTMLButtonElement>();
		const {rerender} = render(
			<>
				<button type="button" ref={restore}>
					return
				</button>
				<BottomSheet
					label="Details"
					initialFocus={initial}
					restoreFocus={restore}
				>
					<button type="button" ref={initial}>
						initial
					</button>
				</BottomSheet>
			</>,
		);
		expect(document.activeElement).toBe(initial.current);
		rerender(
			<button type="button" ref={restore}>
				return
			</button>,
		);
		await waitFor(() =>
			expect(document.activeElement).toBe(restore.current),
		);
	});

	it("keeps initial focus after StrictMode replays the opening effect", async () => {
		render(
			<StrictMode>
				<BottomSheet
					label="Details"
					title="Place"
					initialFocus
					restoreFocus
				/>
			</StrictMode>,
		);
		await new Promise((resolve) => requestAnimationFrame(resolve));
		expect(document.activeElement).toBe(screen.getByRole("heading"));
	});
	it("preserves the original opener across StrictMode effect replay", async () => {
		const opener = document.createElement("button");
		document.body.append(opener);
		opener.focus();
		const {unmount} = render(
			<StrictMode>
				<BottomSheet
					label="Details"
					title="Place"
					initialFocus
					restoreFocus
				/>
			</StrictMode>,
		);
		unmount();
		await waitFor(() => expect(document.activeElement).toBe(opener));
	});

	it("does not refocus or replace the opener when focus options change while open", async () => {
		const opener = document.createElement("button");
		document.body.append(opener);
		opener.focus();
		const {rerender, unmount} = render(
			<BottomSheet label="Details" title="Place" restoreFocus />,
		);
		rerender(
			<BottomSheet
				label="Details"
				title="Place"
				initialFocus
				restoreFocus
			/>,
		);
		expect(document.activeElement).toBe(opener);
		screen.getByRole("separator").focus();
		unmount();
		await waitFor(() => expect(document.activeElement).toBe(opener));
	});
	it("does not let a replaced sheet's focus restoration override the next sheet", async () => {
		const opener = document.createElement("button");
		document.body.append(opener);
		opener.focus();
		const {rerender} = render(
			<BottomSheet
				key="first"
				label="Details"
				title="First"
				initialFocus
				restoreFocus
			/>,
		);
		rerender(
			<BottomSheet
				key="second"
				label="Details"
				title="Second"
				initialFocus
				restoreFocus
			/>,
		);
		await new Promise((resolve) => requestAnimationFrame(resolve));
		expect(document.activeElement).toBe(
			screen.getByRole("heading", {name: "Second"}),
		);
	});
	it("uses the parent scope when the original opener was removed", async () => {
		const opener = document.createElement("button");
		document.body.append(opener);
		opener.focus();
		const content = (open: boolean) => (
			<FocusScope>
				<button type="button">fallback</button>
				<BottomSheet
					open={open}
					label="Details"
					title="Place"
					initialFocus
					restoreFocus
				/>
			</FocusScope>
		);
		const {rerender} = render(content(true));
		opener.remove();
		rerender(content(false));
		await waitFor(() =>
			expect(document.activeElement).toBe(
				screen.getByRole("button", {name: "fallback"}),
			),
		);
	});
});
