import {useRef, useState} from "react";

import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import {afterEach, describe, expect, it} from "vitest";

import {Heading, HeadingsProvider} from "../headings";
import usePopoverDialog from "../hooks/usePopoverDialog";
import PopoverDialog, {type PopoverDialogProps} from "./popover-dialog";

function Example(
	props: Omit<PopoverDialogProps, "triggerRef" | "isOpen" | "onClose">,
) {
	const triggerRef = useRef<HTMLButtonElement>(null);
	const [isOpen, setOpen] = useState(false);
	return (
		<>
			<button ref={triggerRef} onClick={() => setOpen(true)}>
				Open options
			</button>
			<span id="external-title">External filters</span>
			<button>Outside</button>
			<PopoverDialog
				title="Options"
				closeLabel="Close options"
				{...props}
				triggerRef={triggerRef}
				isOpen={isOpen}
				onClose={() => setOpen(false)}
			>
				<Heading>Filters</Heading>
				<button>Inside</button>
			</PopoverDialog>
		</>
	);
}

function open() {
	const trigger = screen.getByRole("button", {name: "Open options"});
	trigger.focus();
	fireEvent.click(trigger);
	return trigger;
}

function clickOutside() {
	const outside = screen.getByRole("button", {name: "Outside"});
	fireEvent.pointerDown(outside, {button: 0, pointerId: 1});
	fireEvent.mouseDown(outside, {button: 0});
	fireEvent.pointerUp(outside, {button: 0, pointerId: 1});
	fireEvent.mouseUp(outside, {button: 0});
	fireEvent.click(outside);
}

afterEach(cleanup);

describe("PopoverDialog with react-aria", () => {
	it("portals a named panel only while open", () => {
		const {container} = render(<Example />);
		expect(screen.queryByRole("dialog")).toBeNull();
		open();
		const dialog = screen.getByRole("dialog", {name: "Options"});
		expect(document.body.contains(dialog)).toBe(true);
		expect(container.contains(dialog)).toBe(false);
		fireEvent.click(screen.getByRole("button", {name: "Close options"}));
		expect(screen.queryByRole("dialog")).toBeNull();
	});

	it.each([
		[{title: undefined, "aria-label": "Filters"}, "Filters"],
		[{title: undefined, labelledBy: "external-title"}, "External filters"],
		[{title: "Options", labelledBy: "options-title"}, "Options"],
	] as const)("resolves an accessible name from %o", (props, name) => {
		render(<Example {...props} portal={false} />);
		open();
		expect(screen.getByRole("dialog", {name})).toBeTruthy();
	});

	it("inherits the page heading rank and scopes the body", () => {
		render(
			<HeadingsProvider enabled options={{baseLevel: 4}}>
				<Example />
			</HeadingsProvider>,
		);
		open();
		expect(
			screen.getByRole("heading", {name: "Options", level: 4}),
		).toBeTruthy();
		expect(
			screen.getByRole("heading", {name: "Filters", level: 5}),
		).toBeTruthy();
	});

	it("contains focus and restores it to the trigger after Escape", async () => {
		render(<Example />);
		const trigger = open();
		const dialog = screen.getByRole("dialog");
		const inside = screen.getByRole("button", {name: "Inside"});
		inside.focus();
		screen.getByRole("button", {name: "Outside"}).focus();
		await waitFor(() =>
			expect(dialog.contains(document.activeElement)).toBe(true),
		);
		fireEvent.keyDown(document.activeElement!, {key: "Escape"});
		await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
		await waitFor(() => expect(document.activeElement).toBe(trigger));
	});

	it.each([true, false])(
		"respects isDismissable=%s for outside clicks",
		(isDismissable) => {
			render(<Example isDismissable={isDismissable} />);
			open();
			clickOutside();
			expect(screen.queryByRole("dialog") !== null).toBe(!isDismissable);
		},
	);
});

// A host wiring the public hook directly needs the trigger ARIA contract too.
function HookExample() {
	const triggerRef = useRef<HTMLButtonElement>(null);
	const popoverRef = useRef<HTMLDivElement>(null);
	const [isOpen, setOpen] = useState(false);
	const {triggerAriaProps, popoverProps} = usePopoverDialog({
		isOpen,
		onClose: () => setOpen(false),
		triggerRef,
		popoverRef,
		popoverId: "host-options",
		"aria-label": "Host options",
	});
	return (
		<>
			<button
				{...triggerAriaProps}
				ref={triggerRef}
				onClick={() => setOpen(true)}
			>
				Open options
			</button>
			{isOpen && (
				<div {...popoverProps} ref={popoverRef}>
					<button>Host filter</button>
				</div>
			)}
		</>
	);
}

it("connects a host trigger to the real hook panel and updates it on dismissal", () => {
	render(<HookExample />);
	const trigger = screen.getByRole("button", {name: "Open options"});
	expect(trigger.getAttribute("aria-expanded")).toBe("false");
	open();
	const dialog = screen.getByRole("dialog", {name: "Host options"});
	expect(trigger.getAttribute("aria-controls")).toBe(dialog.id);
	expect(trigger.getAttribute("aria-expanded")).toBe("true");
	fireEvent.keyDown(dialog, {key: "Escape"});
	expect(screen.queryByRole("dialog")).toBeNull();
	expect(trigger.getAttribute("aria-expanded")).toBe("false");
});
