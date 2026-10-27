import {StrictMode, createRef} from "react";

import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";

import {Heading, HeadingsProvider} from "../../headings";
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
	it("keeps the non-modal sheet in the page outline and scopes its body only with a title", () => {
		const {rerender} = render(
			<HeadingsProvider enabled options={{baseLevel: 3}}>
				<BottomSheet label="Details" title="Place" snaps={[100, 200]}>
					<Heading>Information</Heading>
				</BottomSheet>
			</HeadingsProvider>,
		);
		expect(
			screen.getByRole("heading", {name: "Place", level: 3}),
		).toBeTruthy();
		expect(
			screen.getByRole("heading", {name: "Information", level: 4}),
		).toBeTruthy();
		expect(screen.getByRole("region", {name: "Place"})).toBeTruthy();
		rerender(
			<HeadingsProvider enabled options={{baseLevel: 3}}>
				<BottomSheet label="Details" snaps={[100, 200]}>
					<Heading>Information</Heading>
				</BottomSheet>
			</HeadingsProvider>,
		);
		expect(
			screen.getByRole("heading", {name: "Information", level: 3}),
		).toBeTruthy();
	});
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
	});

	it("translates the resize name and snap text unless the host overrides them", () => {
		setDocumentLanguage("en");
		const {rerender} = render(
			<BottomSheet label="Details" snaps={[100, 200, 300]} />,
		);
		expect(
			screen
				.getByRole("separator", {name: "Resize"})
				.getAttribute("aria-valuetext"),
		).toBe("Position 2 of 3");
		rerender(
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

	function focusOpener() {
		const opener = document.createElement("button");
		document.body.append(opener);
		opener.focus();
		return opener;
	}

	it("moves focus only with initialFocus, to the region when there is no title", () => {
		const opener = focusOpener();
		const {unmount} = render(<BottomSheet label="Details" title="Place" />);
		expect(document.activeElement).toBe(opener);
		unmount();
		render(<BottomSheet label="Details" initialFocus />);
		expect(document.activeElement).toBe(screen.getByRole("region"));
	});

	it("focuses the heading on open and restores the opener on close", async () => {
		const opener = focusOpener();
		const sheet = (open: boolean) => (
			<BottomSheet
				open={open}
				label="Details"
				title="Place"
				initialFocus
				restoreFocus
			/>
		);
		const {rerender} = render(sheet(false));
		rerender(sheet(true));
		expect(document.activeElement).toBe(screen.getByRole("heading"));
		rerender(sheet(false));
		await waitFor(() => expect(document.activeElement).toBe(opener));
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

	it("keeps the initial focus and the original opener across StrictMode effect replay", async () => {
		const opener = focusOpener();
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
		await new Promise((resolve) => requestAnimationFrame(resolve));
		expect(document.activeElement).toBe(screen.getByRole("heading"));
		unmount();
		await waitFor(() => expect(document.activeElement).toBe(opener));
	});
});
